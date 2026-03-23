const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'COLOCAR_AQUI';
const SUPABASE_SERVICE_ROLE_KEY = 'COLOCAR_AQUI';
const TARGET_EMAIL = 'mellaurj@gmail.com';

async function deleteUser() {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log(`Buscando usuário com email: ${TARGET_EMAIL}...`);
    
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      throw listError;
    }

    const user = users.find(u => u.email === TARGET_EMAIL);

    if (user) {
      console.log(`Usuário encontrado! ID: ${user.id}`);
      console.log('Deletando usuário...');
      
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
      
      if (deleteError) {
        throw deleteError;
      }
      
      console.log('Usuário deletado com sucesso!');
    } else {
      console.log('Usuário não encontrado no Auth.');
    }
  } catch (error) {
    console.error('Erro ao executar operação:', error);
  }
}

deleteUser();
