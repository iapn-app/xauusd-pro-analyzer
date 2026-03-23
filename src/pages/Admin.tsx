import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Shield, 
  Crown, 
  Search, 
  Filter, 
  Plus, 
  Trash2, 
  UserPlus, 
  Check, 
  X, 
  MoreVertical,
  ArrowLeft,
  Mail,
  Calendar,
  Zap,
  Star,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { userManagementService, User, UserPlan } from '../services/userManagementService';
import { authService } from '../services/authService';

interface AdminPageProps {
  onBack: () => void;
  onUserUpdate?: (user: any) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onBack, onUserUpdate }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<UserPlan | 'all'>('all');
  const [roleFilter, setRoleFilter] = useState<'admin' | 'vip' | 'user' | 'all'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    plan: 'free' as UserPlan,
    role: 'user' as 'admin' | 'vip' | 'user'
  });
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const fetchedUsers = await userManagementService.getAllUsers();
    setUsers(fetchedUsers);
    // Sync current user session in case admin changed their own role/plan
    const updatedCurrentUser = await authService.getCurrentUser();
    if (updatedCurrentUser && onUserUpdate) {
      onUserUpdate(updatedCurrentUser);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const stats = useMemo(() => {
    return {
      total: users.length,
      free: users.filter(u => u.plan === 'free').length,
      trial: users.filter(u => u.plan === 'trial').length,
      pro: users.filter(u => u.plan === 'pro').length,
      premium: users.filter(u => u.plan === 'premium').length,
      vip: users.filter(u => u.isVip && !u.isAdmin).length,
      admin: users.filter(u => u.isAdmin).length
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = u.email.toLowerCase().includes(search.toLowerCase());
      const matchesPlan = planFilter === 'all' || u.plan === planFilter;
      const matchesRole = roleFilter === 'all' || 
        (roleFilter === 'admin' && u.isAdmin) || 
        (roleFilter === 'vip' && u.isVip && !u.isAdmin) ||
        (roleFilter === 'user' && !u.isAdmin && !u.isVip);
      
      return matchesSearch && matchesPlan && matchesRole;
    });
  }, [users, search, planFilter, roleFilter]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.email || !newUser.password) {
      showNotification('Email e senha são obrigatórios', 'error');
      return;
    }

    try {
      // In a real app, admin would call a backend endpoint to create a user in Supabase Auth
      // For now, we can only register them via authService.register, which logs them in.
      // So creating users from admin panel is tricky without a backend.
      showNotification('Criação de usuário via painel admin requer backend (Supabase Edge Functions)', 'error');
      setIsCreateModalOpen(false);
    } catch (error: any) {
      showNotification(error.message || 'Erro ao criar usuário', 'error');
    }
  };

  const handleDeleteUser = async (email: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o usuário ${email}?`)) {
      await userManagementService.deleteUser(email);
      await loadUsers();
      showNotification('Usuário excluído com sucesso!');
    }
  };

  const handlePromoteToAdmin = async (email: string) => {
    await userManagementService.promoteToAdmin(email);
    await loadUsers();
    showNotification('Usuário promovido a Admin!');
  };

  const handlePromoteToVip = async (email: string) => {
    await userManagementService.promoteToVip(email);
    await loadUsers();
    showNotification('Usuário promovido a VIP!');
  };

  const handleRemovePrivileges = async (email: string) => {
    await userManagementService.removePrivileges(email);
    await loadUsers();
    showNotification('Privilégios removidos com sucesso.');
  };

  const handleSetPlan = async (email: string, plan: UserPlan) => {
    await userManagementService.setPlan(email, plan);
    await loadUsers();
    showNotification(`Plano atualizado para ${plan.toUpperCase()}!`);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-zinc-900 rounded-xl transition-colors text-zinc-400 hover:text-white"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Shield className="text-red-500" size={24} />
                Painel Administrativo
              </h1>
              <p className="text-zinc-500 text-sm">Gestão centralizada de usuários e permissões</p>
            </div>
          </div>
          
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-red-600/20"
          >
            <UserPlus size={18} />
            Novo Usuário
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          {[
            { label: 'Total', value: stats.total, icon: Users, color: 'text-white', bg: 'bg-white/5' },
            { label: 'Free', value: stats.free, icon: Mail, color: 'text-zinc-400', bg: 'bg-zinc-400/5' },
            { label: 'Trial', value: stats.trial, icon: Zap, color: 'text-emerald-400', bg: 'bg-emerald-400/5' },
            { label: 'Pro', value: stats.pro, icon: Star, color: 'text-amber-400', bg: 'bg-amber-400/5' },
            { label: 'Premium', value: stats.premium, icon: Crown, color: 'text-purple-400', bg: 'bg-purple-400/5' },
            { label: 'VIP', value: stats.vip, icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/5' },
            { label: 'Admin', value: stats.admin, icon: Shield, color: 'text-red-500', bg: 'bg-red-500/5' },
          ].map((stat, i) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`${stat.bg} border border-white/5 p-4 rounded-2xl`}
            >
              <div className="flex items-center justify-between mb-2">
                <stat.icon size={16} className={stat.color} />
                <span className={`text-xs font-bold ${stat.color}`}>{stat.label}</span>
              </div>
              <div className="text-2xl font-black">{stat.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Filters & Search */}
        <div className="bg-zinc-900/50 border border-white/5 p-4 rounded-2xl mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-red-500 outline-none transition-colors"
            />
          </div>
          
          <div className="flex gap-2">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <select 
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value as any)}
                className="bg-black border border-white/10 rounded-xl py-2.5 pl-10 pr-8 text-sm focus:border-red-500 outline-none appearance-none cursor-pointer"
              >
                <option value="all">Todos Planos</option>
                <option value="free">Free</option>
                <option value="trial">Trial</option>
                <option value="pro">Pro</option>
                <option value="premium">Premium</option>
              </select>
            </div>

            <div className="relative">
              <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <select 
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="bg-black border border-white/10 rounded-xl py-2.5 pl-10 pr-8 text-sm focus:border-red-500 outline-none appearance-none cursor-pointer"
              >
                <option value="all">Todas Roles</option>
                <option value="user">Usuário Comum</option>
                <option value="vip">VIP</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="bg-zinc-900/30 border border-white/5 rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-bottom border-white/5 bg-white/5">
                  <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Email</th>
                  <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Plano</th>
                  <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Role</th>
                  <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Data de Criação</th>
                  <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {filteredUsers.map((user) => (
                    <motion.tr 
                      key={user.email}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            user.isAdmin ? 'bg-red-500/20 text-red-500' : 
                            user.isVip ? 'bg-emerald-500/20 text-emerald-500' : 
                            'bg-zinc-800 text-zinc-400'
                          }`}>
                            {user.email.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium">{user.email}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-widest ${
                          user.plan === 'premium' ? 'bg-purple-500/10 text-purple-500' :
                          user.plan === 'pro' ? 'bg-amber-500/10 text-amber-500' :
                          user.plan === 'trial' ? 'bg-emerald-500/10 text-emerald-500' :
                          'bg-zinc-800 text-zinc-500'
                        }`}>
                          {user.plan}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          {user.isAdmin ? (
                            <span className="text-[10px] font-black text-red-500 flex items-center gap-1">
                              <Shield size={10} /> ADMIN
                            </span>
                          ) : user.isVip ? (
                            <span className="text-[10px] font-black text-emerald-500 flex items-center gap-1">
                              <Crown size={10} /> VIP
                            </span>
                          ) : (
                            <span className="text-[10px] font-black text-zinc-500">USER</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {user.subscriptionStatus === 'active' && (
                            <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded border border-emerald-500/20">
                              ACTIVE
                            </span>
                          )}
                          {user.subscriptionStatus === 'inactive' && (
                            <span className="text-[9px] font-bold bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded border border-red-500/20">
                              INACTIVE
                            </span>
                          )}
                          {user.isLifetime && (
                            <span className="text-[9px] font-bold bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20">
                              LIFETIME
                            </span>
                          )}
                          {user.plan === 'trial' && user.trialEnd && (
                            <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded border border-emerald-500/20">
                              TRIAL ATIVO
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-xs text-zinc-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Role Actions */}
                          {!user.isAdmin && (
                            <button 
                              onClick={() => handlePromoteToAdmin(user.email)}
                              title="Tornar Admin"
                              className="flex items-center gap-1 px-2 py-1 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-all text-[10px] font-bold"
                            >
                              <Shield size={12} /> ADMIN
                            </button>
                          )}

                          {!user.isVip && (
                            <button 
                              onClick={() => handlePromoteToVip(user.email)}
                              title="Tornar VIP"
                              className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-lg transition-all text-[10px] font-bold"
                            >
                              <Crown size={12} /> VIP
                            </button>
                          )}

                          {(user.isAdmin || user.isVip) && (
                            <button 
                              onClick={() => handleRemovePrivileges(user.email)}
                              title="Remover Privilégios"
                              className="flex items-center gap-1 px-2 py-1 bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white rounded-lg transition-all text-[10px] font-bold"
                            >
                              <X size={12} /> REMOVER
                            </button>
                          )}

                          {/* Plan Actions */}
                          {!user.isAdmin && !user.isVip && (
                            <div className="flex gap-1 border-l border-white/10 pl-2 ml-2">
                              {['free', 'premium'].map((p) => (
                                <button
                                  key={p}
                                  onClick={() => handleSetPlan(user.email, p as UserPlan)}
                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded transition-all ${
                                    user.plan === p 
                                      ? 'bg-white/10 text-white' 
                                      : 'text-zinc-600 hover:text-zinc-400'
                                  }`}
                                >
                                  {p.toUpperCase()}
                                </button>
                              ))}
                            </div>
                          )}

                          <button 
                            onClick={() => handleDeleteUser(user.email)}
                            title="Excluir Usuário"
                            className="p-1.5 hover:bg-red-500/20 text-zinc-500 hover:text-red-500 rounded-lg transition-all ml-2"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
            {filteredUsers.length === 0 && (
              <div className="p-12 text-center">
                <Users size={48} className="mx-auto text-zinc-800 mb-4" />
                <p className="text-zinc-500">Nenhum usuário encontrado com os filtros atuais.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <UserPlus className="text-red-500" />
                  Novo Usuário
                </h2>
                <button 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-xl transition-colors text-zinc-500"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Email</label>
                  <input 
                    type="email" 
                    required
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-red-500 outline-none transition-colors"
                    placeholder="exemplo@email.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Senha</label>
                  <input 
                    type="password" 
                    required
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-red-500 outline-none transition-colors"
                    placeholder="••••••••"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Plano</label>
                    <select 
                      value={newUser.plan}
                      onChange={(e) => setNewUser({ ...newUser, plan: e.target.value as UserPlan })}
                      className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-red-500 outline-none appearance-none cursor-pointer"
                    >
                      <option value="free">Free</option>
                      <option value="pro">Pro</option>
                      <option value="premium">Premium</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Role</label>
                    <select 
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                      className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-red-500 outline-none appearance-none cursor-pointer"
                    >
                      <option value="user">User</option>
                      <option value="vip">VIP</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>

                <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-xl flex gap-3 mt-4">
                  <AlertCircle className="text-red-500 shrink-0" size={18} />
                  <p className="text-[10px] text-zinc-400 leading-relaxed">
                    Usuários criados como <span className="text-white font-bold">Admin</span> ou <span className="text-white font-bold">VIP</span> terão acesso <span className="text-white font-bold">Premium Vitalício</span> automaticamente.
                  </p>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-500 text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-red-600/20 mt-6"
                >
                  Criar Usuário
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border ${
              notification.type === 'success' 
                ? 'bg-emerald-500 text-white border-emerald-400' 
                : 'bg-red-600 text-white border-red-500'
            }`}
          >
            {notification.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
            <span className="text-sm font-bold">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
