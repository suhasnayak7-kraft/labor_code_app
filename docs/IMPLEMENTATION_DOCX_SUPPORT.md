# Add .docx Support to AuditAI

**Scope:** Add Word document (.docx) upload support to the audit endpoint
**Effort:** 1-2 hours (straightforward addition)
**Files to modify:** `backend/main.py`, `backend/requirements.txt`
**Testing:** Manual test with 2-3 .docx files
**Risk level:** Low (optional feature, doesn't affect existing PDF flow)

---

## Why This Matters

- ✅ **Many companies share policies as .docx** (not PDF)
- ✅ **Expands addressable market** (CAs will have more client policies to audit)
- ✅ **Quick feature** (python-docx is mature & simple)
- ✅ **No breaking changes** (PDF still works as before)

---

## Implementation Plan

### Step 1: Add python-docx Dependency (2 minutes)

**File:** `backend/requirements.txt`

Add this line:
```
python-docx==0.8.11
```

Then install locally:
```bash
pip install python-docx==0.8.11
```

---

### Step 2: Add DOCX Text Extraction Function (5 minutes)

**File:** `backend/main.py`

Add this function after the `extract_and_clean_text()` function (around line 98):

```python
def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract text from a .docx file."""
    from docx import Document
    from io import BytesIO

    try:
        doc = Document(BytesIO(file_bytes))
        paragraphs = [para.text for para in doc.paragraphs if para.text.strip()]
        full_text = "\n".join(paragraphs)

        # Also extract text from tables
        for table in doc.tables:
            for row in table.rows:
                row_text = [cell.text.strip() for cell in row.cells]
                full_text += "\n" + " | ".join(row_text)

        clean_text = re.sub(r'\s+', ' ', full_text).strip()
        return clean_text
    except Exception as e:
        raise ValueError(f"Could not read .docx file: {str(e)}")
```

---

### Step 3: Update File Upload Validation (3 minutes)

**File:** `backend/main.py` → `@app.post("/audit")` function

**Find this line (around line 174):**
```python
if not file.filename.lower().endswith('.pdf'):
    raise HTTPException(status_code=400, detail="Only PDF files are supported. Please upload a .pdf file.")
```

**Replace with:**
```python
file_ext = file.filename.lower()
if not (file_ext.endswith('.pdf') or file_ext.endswith('.docx')):
    raise HTTPException(status_code=400, detail="Only PDF and Word (.docx) files are supported. Please upload a .pdf or .docx file.")
```

---

### Step 4: Add File Type Detection & Routing (5 minutes)

**File:** `backend/main.py` → `@app.post("/audit")` function

**Find this section (around line 177-191):**
```python
try:
    # 1. Convert PDF to text
    file_bytes = await file.read()
    if len(file_bytes) > 20 * 1024 * 1024:  # 20MB guard
        raise HTTPException(status_code=400, detail="File too large. Maximum PDF size is 20MB.")

    try:
        policy_text = extract_and_clean_text(file_bytes)
    except Exception as pdf_err:
        print(f"PDF extraction error: {pdf_err}")
        raise HTTPException(status_code=400, detail="Could not read the PDF. The file may be corrupted, password-protected, or image-only (scanned). Please try a text-based PDF.")
```

**Replace with:**
```python
try:
    # 1. Convert Document to text (PDF or DOCX)
    file_bytes = await file.read()
    if len(file_bytes) > 20 * 1024 * 1024:  # 20MB guard
        raise HTTPException(status_code=400, detail="File too large. Maximum file size is 20MB.")

    try:
        if file.filename.lower().endswith('.pdf'):
            policy_text = extract_and_clean_text(file_bytes)
        elif file.filename.lower().endswith('.docx'):
            policy_text = extract_text_from_docx(file_bytes)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type. Please upload a .pdf or .docx file.")
    except HTTPException:
        raise
    except Exception as doc_err:
        print(f"Document extraction error: {doc_err}")
        file_type = "Word document" if file.filename.lower().endswith('.docx') else "PDF"
        raise HTTPException(status_code=400, detail=f"Could not read the {file_type}. The file may be corrupted or invalid. Please try another file.")
```

---

### Step 5: Update API Response Comment (1 minute)

**File:** `backend/main.py` → `@app.post("/audit")` docstring

If there's a docstring, update it to mention both file types:

```python
@app.post("/audit", response_model=AuditResponse)
async def audit_policy(
    file: UploadFile = File(...),
    model_id: Optional[str] = Form("gemini-1.5-flash"),
    user = Depends(get_current_user)
):
    """
    Audit an employee policy document for Labour Code compliance.

    Accepts: PDF (.pdf) or Word (.docx) files
    Maximum file size: 20MB
    """
```

---

## Testing Checklist

### Before Deploying

- [ ] **Install dependency:** `pip install python-docx==0.8.11`
- [ ] **Test with PDF:** Upload an existing PDF → verify it still works
- [ ] **Test with valid .docx:** Upload a Word document → verify text extraction
- [ ] **Test with .docx containing tables:** Verify tables are extracted
- [ ] **Test with corrupted .docx:** Verify error handling
- [ ] **Test file size limit:** Try uploading >20MB file → verify error

### Test Files to Create

You can use these for testing:

**Test 1: Simple .docx**
```
Content: Company Policy Document
[Some simple text about employee benefits, leave policy, etc.]
```
Expected: Should extract all text successfully

**Test 2: .docx with Tables**
```
Company | Employees
HR Rules | [table with policies]
```
Expected: Should extract both paragraphs and table content

---

## Code Review Checklist

Before committing:

- [ ] `extract_text_from_docx()` function added
- [ ] File validation updated to accept `.docx`
- [ ] File type detection logic added
- [ ] Error messages updated to mention both file types
- [ ] `requirements.txt` updated with `python-docx==0.8.11`
- [ ] No existing PDF functionality broken

---

## Deployment

1. **Update requirements.txt**
   ```bash
   pip install python-docx==0.8.11
   ```

2. **Commit changes**
   ```bash
   git add backend/main.py backend/requirements.txt
   git commit -m "feat: add .docx (Word document) support for policy audits"
   git push origin main
   ```

3. **Vercel auto-deploys** in 30-60 seconds

4. **Test in production**
   - Upload a .docx file
   - Verify compliance score displays
   - Check logs for any errors

---

## Performance & Limits

| Aspect | Details |
|--------|---------|
| **Max file size** | 20MB (same as PDF) |
| **Text extraction time** | ~100-200ms for typical policies |
| **Supported .docx versions** | Office 2007+ (.docx format) |
| **Tables** | Extracted and included in analysis |
| **Formatted text** | Extracted (bold, italic, etc. stripped) |
| **Images in .docx** | Ignored (only text extracted) |

---

## Edge Cases Handled

| Case | Behavior |
|------|----------|
| Corrupted .docx | Returns error: "Could not read the Word document" |
| Empty .docx | Returns error: "Could not extract sufficient text" |
| .docx with only images | Returns error: "Could not extract sufficient text" |
| .doc (old format) | Returns error: "Unsupported file type" |
| >20MB file | Returns error: "File too large" |

---

## Future Enhancements (Not Needed Now)

- ✅ Support for .doc (old Word format) — lower priority
- ✅ Support for Google Docs link import — much later
- ✅ Support for .odt (OpenOffice) — low demand

---

## Quick Reference

**Files modified:**
1. `backend/main.py` — 15 lines added/changed
2. `backend/requirements.txt` — 1 line added

**Functions added:**
1. `extract_text_from_docx()` — 15 lines

**Total implementation time:** 1-2 hours (including testing)

---

## Ready to Implement?

This is a straightforward addition. No breaking changes, clear error handling, and immediate value for your users (CAs can now audit Word documents).

Let me know when you're ready to start! 🚀
