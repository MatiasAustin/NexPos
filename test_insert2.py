
import os
import json
from supabase import create_client

lines = open('.env').readlines()
url = [l.split('=')[1].strip() for l in lines if l.startswith('SUPABASE_URL')][0]
key = [l.split('=')[1].strip() for l in lines if l.startswith('SUPABASE_KEY')][0]
client = create_client(url, key)

res = client.auth.sign_in_with_password({'email': 'tiasaustin32@gmail.com', 'password': 'SuBaRU70'})
staff_id = res.user.id

# just get any session
session = client.table('cash_sessions').select('id').limit(1).execute()
if not session.data:
    print('No session found at all')
    exit(1)

session_id = session.data[0]['id']

payload = {
    'session_id': session_id,
    'staff_id': staff_id,
    'type': 'expense',
    'amount': -1000,
    'reason': 'Test Pengeluaran'
}
try:
    move_res = client.table('cash_movements').insert(payload).execute()
    print('Insert Success:', move_res)
except Exception as e:
    print('Insert Error:', e)
