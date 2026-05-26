import { supabase } from './supabase';

export async function getKV(key: string, defaultValue: any) {
  try {
    const { data, error } = await supabase.from('store_settings').select('value').eq('key', key).single();
    if (error || !data) return defaultValue;
    return data.value;
  } catch (e) {
    return defaultValue;
  }
}

export async function setKV(key: string, value: any) {
  try {
    const { data } = await supabase.from('store_settings').select('id').eq('key', key).single();
    if (data) {
      await supabase.from('store_settings').update({ 
        value, 
        updated_at: new Date().toISOString() 
      }).eq('id', data.id);
    } else {
      await supabase.from('store_settings').insert({ 
        key, 
        value, 
        updated_at: new Date().toISOString() 
      });
    }
    return true;
  } catch (e) {
    console.error(`Erro ao salvar ${key} no Supabase:`, e);
    return false;
  }
}
