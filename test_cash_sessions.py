
import os
import json
from supabase import create_client

lines = open('.env').readlines()
url = [l.split('=')[1].strip() for l in lines if l.startswith('SUPABASE_URL')][0]
key = [l.split('=')[1].strip() for l in lines if l.startswith('SUPABASE_KEY')][0]
client = create_client(url, key)

res = client.auth.sign_in_with_password({'email': 'tiasaustin32@gmail.com', 'password': 'SuBaRU70'})
staff_id = res.user.id

# we don't have session_id. Can we just fetch cash_sessions?
session = client.table('cash_sessions').select('id, expected_cash').limit(1).execute()
print('session:', session)
