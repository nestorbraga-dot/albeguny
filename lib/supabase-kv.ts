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
    const { data, error: selectError } = await supabase.from('store_settings').select('id').eq('key', key).single();
    
    if (data) {
      const { error: updateError } = await supabase.from('store_settings').update({ 
        value, 
        updated_at: new Date().toISOString() 
      }).eq('id', data.id);
      
      if (updateError) {
        console.error(`Supabase Update Error para ${key}:`, updateError);
        return false;
      }
    } else {
      const { error: insertError } = await supabase.from('store_settings').insert({ 
        key, 
        value, 
        updated_at: new Date().toISOString() 
      });
      
      if (insertError) {
        console.error(`Supabase Insert Error para ${key}:`, insertError);
        return false;
      }
    }
    return true;
  } catch (e) {
    console.error(`Erro inesperado ao salvar ${key} no Supabase:`, e);
    return false;
  }
}
