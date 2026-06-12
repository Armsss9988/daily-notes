import os, sys, json, datetime, re, quopri
import requests
import win32com.client

NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions"
NVIDIA_MODEL = "meta/llama-3.1-8b-instruct"
EML_PATH = os.path.expanduser(r"~\Downloads\Daily Report Template.eml")
LOG_PATH = os.path.expanduser(r"~\AppData\Local\Temp\generate_report_debug.log")

def log(msg):
    with open(LOG_PATH, "a", encoding="utf-8") as f:
        f.write(f"{datetime.datetime.now().isoformat()}: {msg}\n")

def load_eml_template():
    with open(EML_PATH, "r", encoding="utf-8") as f:
        text = f.read()
    m = re.search(r'Content-Type: text/html; charset="([^"]+)"\s*Content-Transfer-Encoding: quoted-printable\s*\n\s*(.*?)\n--_000_', text, re.DOTALL)
    if not m:
        raise RuntimeError("Could not find HTML part in .eml")
    charset = m.group(1)
    raw = m.group(2)
    decoded = quopri.decodestring(raw.encode("ascii")).decode(charset)

    # Insert placeholders by replacing empty learning item rows and cells
    # Replace the two empty learning item rows with {{LEARNING_ITEMS}}
    decoded = re.sub(
        r'<tr>\s*<td[^>]*height:\s*62\.6875px[^>]*>\s*(?:<div[^>]*>\s*<br>\s*</div>\s*)?</td>\s*<td[^>]*height:\s*62\.6875px[^>]*>\s*<div[^>]*>\s*<br>\s*</div>\s*</td>\s*</tr>\s*<tr>\s*<td[^>]*height:\s*62\.6875px[^>]*>\s*<div[^>]*>\s*<br>\s*</div>\s*</td>\s*<td[^>]*height:\s*62\.6875px[^>]*>\s*<div[^>]*>\s*<br>\s*</div>\s*</td>\s*</tr>',
        '{{LEARNING_ITEMS}}',
        decoded
    )
    # Replace empty questions cell with {{QUESTIONS}}
    decoded = re.sub(
        r'<td colspan="2"[^>]*height:\s*51\.2396px[^>]*>\s*(?:<div[^>]*>\s*<br>\s*</div>\s*)?</td>',
        '<td colspan="2" style="direction:ltr;text-align:left;border-right:1pt solid;border-bottom:1pt solid;border-left:1pt solid;padding:0in 5.4pt;vertical-align:top;width:652.115px;height:51.2396px;box-sizing:border-box">{{QUESTIONS}}</td>',
        decoded
    )
    # Replace empty gains content cell with {{GAINS}}
    decoded = re.sub(
        r'<td colspan="2"[^>]*height:\s*38\.9375px[^>]*>\s*(?:<div[^>]*>\s*<br>\s*</div>\s*)?</td>',
        '<td colspan="2" data-ogsb="rgb(255, 255, 255)" style="direction:ltr;text-align:left;border-right:1pt solid;border-bottom:1pt solid;border-left:1pt solid;background-color:rgb(255,255,255);padding:0in 5.4pt;vertical-align:top;width:652.115px;height:38.9375px;box-sizing:border-box">{{GAINS}}</td>',
        decoded
    )
    return decoded

def call_nim_api(api_key, prompt):
    log(f"API call with model={NVIDIA_MODEL}")
    r = requests.post(NVIDIA_API_URL,
        headers={"Authorization": f"Bearer {api_key}", "Accept": "application/json"},
        json={
            "model": NVIDIA_MODEL,
            "messages": [
                {"role": "system", "content": "You are a data extractor. Output ONLY raw JSON with no markdown, no code blocks, no explanations."},
                {"role": "user", "content": prompt},
            ],
            "max_tokens": 8192,
            "temperature": 0.1,
        },
        timeout=120)
    r.raise_for_status()
    resp = r.json()
    if "error" in resp:
        raise RuntimeError(str(resp["error"]))
    content = resp["choices"][0]["message"]["content"]
    if content:
        return content
    reasoning = resp["choices"][0]["message"].get("reasoning", "")
    if reasoning:
        start = reasoning.find("{")
        end = reasoning.rfind("}")
        if start >= 0 and end > start:
            return reasoning[start:end+1]
    raise RuntimeError("Model returned no content")

def extract_json(text):
    decoder = json.JSONDecoder()
    idx = 0
    while idx < len(text):
        brace = text.find("{", idx)
        if brace < 0:
            break
        try:
            obj, end = decoder.raw_decode(text, brace)
            if isinstance(obj, dict) and "learning_items" in obj:
                return obj
            idx = end
        except json.JSONDecodeError:
            idx = brace + 1
    raise RuntimeError(f"No valid JSON found:\n{text[:500]}")

def generate_content(api_key, note_text, today_str):
    safe_note = note_text or ""
    log(f"Raw note text length={len(safe_note)}, preview={safe_note[:200]}")
    safe_note = re.sub(r'!\[.*?\]\(.*?\)', '', safe_note)
    safe_note = re.sub(r'<img[^>]*>', '', safe_note, flags=re.IGNORECASE)
    safe_note = re.sub(r'\b\S*\.(png|jpg|jpeg|gif|webp|bmp|svg)\b', '', safe_note, flags=re.IGNORECASE)
    safe_note = re.sub(r'["\']?\w*image\.(png|jpg|jpeg|gif)[^.\s]*["\']?', '', safe_note, flags=re.IGNORECASE)
    safe_note = safe_note.strip() or "(none)"
    log(f"Sanitized note preview={safe_note[:200]}")

    prompt = f"""Date: {today_str}
Daily notes: {safe_note}

Output JSON:
{{"learning_items":[{{"content":"...","progress":"..."}}],"questions":"None","gains":["...","..."]}}"""

    result = call_nim_api(api_key, prompt)
    log(f"API result: {result[:300]}")
    return extract_json(result)

def fill_template_html(data, today_str):
    items = data.get("learning_items", [])
    questions = data.get("questions", "None")
    gains = data.get("gains", [])

    template = load_eml_template()
    log(f"Template loaded, length={len(template)}")

    # Build learning item rows
    item_rows = ""
    for item in items:
        item_rows += f"""<tr>
      <td data-editing-info='{{"vAlignOverride":true}}' style="direction:ltr;text-align:left;border-right:1pt solid;border-bottom:1pt solid;border-left:1pt solid;padding:0in 5.4pt;vertical-align:middle;word-break:break-word;width:383.792px;height:62.6875px;box-sizing:border-box">
        <div class="skipProofing" style="direction:ltr;text-align:left;margin:0px;font-family:Aptos,Aptos_EmbeddedFont,Aptos_MSFontService,Calibri,Helvetica,sans-serif;font-size:11pt;color:rgb(0,0,0)">{item['content']}</div>
      </td>
      <td data-editing-info='{{"vAlignOverride":true}}' style="direction:ltr;text-align:left;border-right:1pt solid;border-bottom:1pt solid;padding:0in 5.4pt;vertical-align:middle;word-break:break-word;width:268.323px;height:62.6875px;box-sizing:border-box">
        <div class="skipProofing" style="direction:ltr;text-align:left;margin:0px;font-family:Aptos,Aptos_EmbeddedFont,Aptos_MSFontService,Calibri,Helvetica,sans-serif;font-size:11pt;color:rgb(0,0,0)">{item['progress']}</div>
      </td>
    </tr>"""

    # Build gains HTML
    gain_html = ""
    for j, g in enumerate(gains, 1):
        gain_html += f'<div class="skipProofing" style="direction:ltr;text-align:left;text-indent:-0.25in;margin:0in 0in 8pt 39pt;font-family:Aptos,Aptos_EmbeddedFont,Aptos_MSFontService,Calibri,Helvetica,sans-serif;font-size:11pt;color:rgb(0,0,0)">{j}. {g}</div>\n'

    # Simple replacements
    result = template.replace("{{LEARNING_ITEMS}}", item_rows)
    result = result.replace("{{QUESTIONS}}", questions)
    result = result.replace("{{GAINS}}", gain_html)
    result = result.replace("DD/MM/YYYY \u2013 Name", f"{today_str} \u2013 Reed Le")
    result = result.replace("DD/MM/YYYY =96 Name", f"{today_str} \u2013 Reed Le")

    # Fix signature: replace Rico Dao with Reed Le (only in Signature div)
    result = result.replace('id="Signature" class="elementToProof"', 'id="Signature" class="elementToProof"')
    sig_start = result.find('id="Signature"')
    if sig_start >= 0:
        sig_end = result.find("</div>", sig_start)
        sig_end = result.find("</div>", sig_end + 1)  # second </div> closes Signature
        if sig_end > sig_start:
            old_sig = result[sig_start:sig_end+6]
            new_sig = old_sig.replace("Rico Dao", "Reed Le")
            new_sig = new_sig.replace("rico.dao@avepoint.com", "reed.le@avepoint.com")
            new_sig = new_sig.replace("Rico.Dao@avepoint.com", "Reed.Le@avepoint.com")
            result = result[:sig_start] + new_sig + result[sig_end+6:]

    log(f"Filled HTML length={len(result)}")
    return result

def main():
    log(f"=== START ===")
    json_data = None
    note_text = ""
    date_str = ""
    if len(sys.argv) > 1 and sys.argv[1] == '--json':
        json_data = json.loads(sys.stdin.read())
        if len(sys.argv) > 2:
            date_str = sys.argv[2]
    elif len(sys.argv) > 1:
        note_text = sys.argv[1]
    try:
        if json_data is not None:
            data = json_data
            if date_str:
                today_str = datetime.datetime.strptime(date_str, "%Y-%m-%d").strftime("%d/%m/%Y")
            else:
                today_str = datetime.date.today().strftime("%d/%m/%Y")
        else:
            api_key = os.environ.get("NVIDIA_API_KEY", "")
            if not api_key:
                print("ERROR: NVIDIA_API_KEY not set", file=sys.stderr)
                sys.exit(1)
            today_str = datetime.date.today().strftime("%d/%m/%Y")
            data = generate_content(api_key, note_text, today_str)
        log(f"Data: {json.dumps(data)[:300]}")
        html_body = fill_template_html(data, today_str)
        log(f"Creating Outlook draft")
        outlook = win32com.client.Dispatch("Outlook.Application")
        mail = outlook.CreateItem(0)
        mail.Subject = f"Daily Report {today_str} - Reed Le"
        mail.To = "Rico.Dao@avepoint.com"
        mail.CC = "alita.tran@avepoint.com; jiaqi.xuan@avepoint.com"
        mail.HTMLBody = html_body
        mail.Display(False)
        log("=== OK ===")
        print("OK")
    except Exception as e:
        log(f"ERROR: {e}")
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
