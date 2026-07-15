import requests
import json

key = 'AQ.Ab8RN6IwqRczTWTQ4barjunGLIfPP9wQX9_K_R0ghntfKNfyDw'
base_url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + key

prompts = [
    ('Technical',  'Generate a Short Answer question about Python decorators for a Mid-level Software Engineer Google interview. Return ONLY valid JSON: {"question_text":"...","question_type":"Short Answer","difficulty":"Medium","options":[],"correct_answer":"..."}'),
    ('Reasoning',  'Generate a Logical Puzzle question for a Mid-level Software Engineer interview. Return ONLY valid JSON: {"question_text":"...","question_type":"Logical Puzzle","difficulty":"Medium","options":[],"correct_answer":"..."}'),
    ('Aptitude',   'Generate a Probability aptitude question for a Mid-level Software Engineer interview. Return ONLY valid JSON: {"question_text":"...","question_type":"Aptitude","difficulty":"Medium","options":[],"correct_answer":"..."}'),
    ('Coding MCQ', 'Generate a Multiple Choice coding question about Python for a Mid-level Software Engineer Google interview. Return ONLY valid JSON: {"question_text":"...","question_type":"Multiple Choice","difficulty":"Medium","options":["A","B","C","D"],"correct_answer":"..."}'),
]

print("=== Gemini 2.5 Flash - Live Question Generation Test ===\n")
all_passed = True
for label, prompt in prompts:
    try:
        r = requests.post(base_url, json={
            'contents': [{'parts': [{'text': prompt}]}],
            'generationConfig': {
                'temperature': 0.8,
                'maxOutputTokens': 2000,
                'responseMimeType': 'application/json'
            }
        }, timeout=30)

        if r.status_code == 200:
            raw = r.json()['candidates'][0]['content']['parts'][0]['text']
            d = json.loads(raw)
            qtype = d.get('question_type', '?')
            diff  = d.get('difficulty', '?')
            qtext = d.get('question_text', '')[:150]
            print(f"[{label}]  type={qtype}  diff={diff}")
            print(f"  Q: {qtext}")
            if d.get('options'):
                print(f"  Options: {d['options']}")
            print()
        else:
            print(f"[{label}] FAILED status={r.status_code}: {r.text[:120]}")
            all_passed = False
    except Exception as e:
        print(f"[{label}] EXCEPTION: {e}")
        all_passed = False

if all_passed:
    print("SUCCESS - Gemini 2.5 Flash is fully connected and generating questions!")
else:
    print("Some tests failed - check errors above.")
