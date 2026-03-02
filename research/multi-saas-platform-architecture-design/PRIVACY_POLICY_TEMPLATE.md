# Privacy Policy Template

**For:** [YOUR_COMPANY_NAME]
**Service:** [YOUR_SERVICE_NAME]
**Effective Date:** [DATE]
**Last Updated:** [DATE]

---

## 1. Introduction

This Privacy Policy explains how [YOUR_COMPANY_NAME] ("we," "us," "our," or "Company") collects, uses, discloses, and otherwise processes personal data through our website ([YOUR_WEBSITE_URL]) and services ("Service").

We are committed to protecting your privacy and complying with the **Digital Personal Data Protection (DPDP) Act, 2023**, India's comprehensive data protection legislation.

---

## 2. What Data We Collect

### 2.1 Data You Provide Directly

**Account Information:**
- Name, email address, phone number
- Company name and designation
- Address and billing information
- Password and authentication credentials

**Service Usage Data:**
- Documents you upload (PDFs, Word files, Excel spreadsheets)
- Audit reports and compliance results
- Preferences and settings
- Support communications and chat history

**Payment Information:**
- Credit/debit card details (processed by payment gateway, we don't store)
- Billing address and transaction history
- Subscription plan details

### 2.2 Data Collected Automatically

**Device & Browser Information:**
- IP address and device type
- Browser type and version
- Operating system
- Device identifiers
- Timestamps of access

**Usage Analytics:**
- Pages visited and time spent
- Features accessed
- File upload history (timestamps only, not content)
- Click patterns and user behavior
- API endpoint calls and response times

**Cookies & Tracking:**
- Session cookies (necessary for login)
- Analytics cookies (Google Analytics, Mixpanel)
- Preference cookies (language, theme)

### 2.3 Data from Third Parties

- Payment processor (Razorpay) - card details and transaction status
- Email service provider - engagement metrics
- Analytics providers - user behavior aggregates
- Cloudflare - security and DDoS protection logs

---

## 3. Why We Collect This Data

| Data Type | Purpose | Legal Basis |
|-----------|---------|------------|
| Account Information | Create & manage your account | Contractual necessity |
| Documents Uploaded | Perform compliance audits | Contractual necessity |
| Email Address | Send notifications & updates | Consent + contractual necessity |
| Usage Analytics | Improve service & identify bugs | Legitimate interest |
| Device Information | Prevent fraud & security threats | Legitimate interest |
| Payment Info | Process subscriptions | Contractual necessity + legal obligation (tax) |

---

## 4. How We Use Your Data

**Primary Uses:**
1. Deliver and maintain the Service
2. Process payments and manage subscriptions
3. Provide customer support
4. Send service updates, announcements, and compliance reminders
5. Conduct security audits and prevent fraud

**Secondary Uses:**
6. Improve service features based on usage patterns
7. Create anonymized analytics and reports
8. Comply with legal obligations (GST, tax, audit trails)

**We will NEVER:**
- Sell your personal data to third parties
- Share your uploaded documents with competitors
- Use your data for marketing to unrelated products
- Combine your data with external data sources without consent

---

## 5. Data Retention Policy

| Data Type | Retention Period | Reason |
|-----------|-----------------|--------|
| Account Profile | Until account deletion | Service delivery |
| Uploaded Documents | 90 days after deletion request | Backup & recovery |
| Audit Logs | 1 year | DPDP compliance & fraud prevention |
| Payment Records | 6 years | Tax & legal compliance (GST Act) |
| Analytics Data | 12 months | Service improvement |
| Support Communications | 30 days after resolution | Support quality & dispute resolution |
| Deleted User Data | 30 days (anonymized thereafter) | GDPR & DPDP right to erasure |

**Backup Data:** Even after deletion, data may exist in backups for up to 90 days before being purged.

---

## 6. Where Your Data Is Stored

**Primary Storage:**
- **Supabase PostgreSQL Database** - Hosted in [REGION: India/EU/US]
- **Location:** [Specify your chosen data center]
- **Encryption:** AES-256 at rest, TLS 1.3 in transit

**Secondary Storage:**
- **Email Service** - [Resend/SendGrid] (transactional emails only)
- **Payment Processor** - Razorpay (India-based, PCI-DSS compliant)
- **Backup Storage** - Encrypted cloud backups (same region as primary)
- **Logs & Monitoring** - Sentry (error tracking), Cloudflare (security logs)

**Data Localization (DPDP Requirement):**
- All personal data of Indian residents is stored in India
- Cross-border transfers only with explicit consent (if any)
- No transfer to countries without adequate data protection laws

---

## 7. Your Rights Under DPDP Act, 2023

As a data subject under DPDP Act, you have the following rights:

### 7.1 Right to Access
You can request a copy of all personal data we hold about you.
- **How:** Email [SUPPORT_EMAIL] with subject "Data Access Request"
- **Timeline:** Response within 30 days

### 7.2 Right to Correction
You can correct inaccurate or incomplete data.
- **How:** Log in to your account → Settings → Edit Profile, OR email us
- **Timeline:** Correction within 15 days

### 7.3 Right to Erasure ("Right to Be Forgotten")
You can request deletion of your data (with exceptions for legal compliance).
- **How:** Account Settings → Delete Account → Confirm
- **What Happens:**
  - Account deleted immediately
  - Documents anonymized after 90 days
  - Payment records retained for 6 years (tax law requirement)
- **Timeline:** Complete deletion within 30 days (except legally required data)

### 7.4 Right to Data Portability
You can request your data in a portable, machine-readable format (CSV/JSON).
- **How:** Email [SUPPORT_EMAIL] with subject "Data Portability Request"
- **Timeline:** Delivered within 30 days in CSV format

### 7.5 Right to Withdraw Consent
You can withdraw consent for optional data processing (e.g., analytics cookies, marketing emails).
- **How:** Account Settings → Privacy Preferences → Uncheck consent boxes
- **Effect:** Immediate cessation of that specific processing

### 7.6 Right to Lodge a Complaint
If you believe we've violated DPDP Act, you can file a complaint with India's Data Protection Board.
- **Contact:** [Link to grievance details below]

---

## 8. Data Processing & Third-Party Sharing

### 8.1 Who Has Access to Your Data

**Internal:**
- Support team (for customer service)
- Engineering team (for service improvement, anonymized)
- Admin team (for security & compliance, anonymized stats)

**External (with Contractual Data Processing Agreements):**
- Supabase (cloud infrastructure)
- Razorpay (payment processing)
- Sentry (error monitoring - anonymized)
- Cloudflare (security & DDoS protection)
- Email service provider ([Resend/SendGrid])

**Absolutely NO Access:**
- Third-party advertisers
- Data brokers or aggregators
- Marketing agencies
- Your competitors

### 8.2 Data Processing Agreements

All third-party vendors have signed Data Processing Agreements (DPA) requiring them to:
- Process data only per our instructions
- Maintain data confidentiality
- Implement appropriate security measures
- Not share data with other parties
- Delete data upon request

---

## 9. Security Measures

We implement industry-standard security practices:

**Infrastructure Security:**
- AES-256 encryption at rest
- TLS 1.3 encryption in transit
- PostgreSQL row-level security (RLS)
- Regular database backups (encrypted)

**Application Security:**
- JWT-based authentication
- Rate limiting & DDoS protection (Cloudflare WAF)
- Regular penetration testing
- Dependency vulnerability scanning

**Operational Security:**
- Secrets management (environment variables, not code)
- Admin access logging and audit trails
- Quarterly access reviews
- Multi-factor authentication for admins

**Employee Security:**
- All team members sign NDA
- Background checks (where applicable)
- Limited data access (principle of least privilege)

**Incident Response:**
- 24-hour breach detection monitoring
- Notification within 72 hours of data breach discovery
- Incident post-mortems and remediation plans

**Still, no system is 100% secure.** You use our service at your own risk. We are not liable for unauthorized access due to security breaches beyond our control.

---

## 10. Cookies & Tracking Technologies

### 10.1 Cookies We Use

**Essential Cookies:**
- `session_token` - Keeps you logged in
- `csrf_token` - Prevents cross-site attacks
- **Cannot be disabled** (required for service functionality)

**Analytics Cookies:**
- `_ga` - Google Analytics (identifies unique visitors)
- `_gid` - Google Analytics (session tracking)
- **Can be disabled** in privacy settings or browser

**Preference Cookies:**
- `theme_preference` - Dark/light mode
- `language_preference` - UI language selection
- **Can be disabled** or deleted anytime

### 10.2 Disabling Cookies

You can opt out of analytics in your browser:
- Chrome: Settings → Privacy & Security → Cookies
- Firefox: Preferences → Privacy → Enhanced Tracking Protection
- Safari: Preferences → Privacy → Manage Website Data

We also respect the "Do Not Track" signal if your browser sends it.

---

## 11. Automated Decision Making

**We do NOT use:**
- AI/ML for credit decisions or account denials
- Automated profiling for pricing discrimination
- Algorithmic suspension or termination of accounts

**We do use (transparently):**
- Fraud detection systems (flagged for human review)
- Spam filtering (automatic)
- Rate limiting (automatic, to prevent abuse)

You can request human review of any automated decision.

---

## 12. Marketing & Communications

### 12.1 Email Communications

**Transactional Emails (required):**
- Account verification
- Password reset
- Subscription confirmations
- Invoice & receipt
- Security alerts

**Promotional Emails (optional):**
- New feature announcements
- Compliance tips & webinar invites
- Special offers (if you subscribed to Compliance Insights)
- Product updates

**How to Unsubscribe:**
- Click "Unsubscribe" link at bottom of every email
- OR go to Settings → Notifications → uncheck "Promotional emails"
- OR email [SUPPORT_EMAIL] with "Unsubscribe" request
- **We'll process within 3 business days**

### 12.2 No Spam Policy

- We never buy email lists or spam
- You'll only receive emails if you opted in
- Maximum 2 promotional emails per week
- If you unsubscribe, you won't hear from us except for legal requirements

---

## 13. International Data Transfers

**IMPORTANT: This clause applies ONLY if you have international users.**

- **India-only users:** No transfers. Data stays in India.
- **International users:** Data processed in India but may need transit through secure channels.
- **Consent:** By using our service, international users consent to India-based processing under DPDP Act.

We do NOT transfer personal data to countries outside India or other EU-equivalent jurisdictions without adequate legal frameworks.

---

## 14. Children's Privacy (COPPA)

Our service is NOT intended for anyone under 18 years old.

- We do not knowingly collect data from minors
- If we discover we've collected minor's data, we delete it immediately
- Parents/guardians who believe we have their child's data: email [SUPPORT_EMAIL]

---

## 15. Grievance Officer & Data Protection

**For DPDP Act Complaints:**

**Grievance Officer (First Point of Contact):**
- Name: [YOUR_GRIEVANCE_OFFICER_NAME]
- Email: [GRIEVANCE_EMAIL]
- Phone: [PHONE_NUMBER]
- Response Timeline: 30 days

**Escalation (India Data Protection Board):**
- If unsatisfied with our response, file complaint with:
  - **India Data Protection Board** (once established under DPDP Act)
  - Details: [Will be updated as per DPDP regulations]

**For Non-DPDP Issues:**
- Privacy concerns: [SUPPORT_EMAIL]
- Security issues: [SECURITY_EMAIL] (mark as "Security Incident")
- Billing issues: [BILLING_EMAIL]

---

## 16. Changes to This Privacy Policy

We may update this Privacy Policy to:
- Reflect changes to our data practices
- Comply with new regulations
- Improve clarity

**How we notify you:**
1. Email notification (for material changes)
2. Updated "Last Modified" date on this page
3. Prominent notice on our website for 30 days

**Your choices:**
- Continue using the service = accept new terms
- If you disagree with changes, delete your account

We will never make material changes that reduce your privacy rights without explicit consent.

---

## 17. Your Rights Summary

**Quick Reference Table:**

| Right | How to Exercise | Response Time | Cost |
|-------|-----------------|---|---|
| **Access** | Email or Settings | 30 days | Free |
| **Correction** | Settings → Edit Profile | 15 days | Free |
| **Erasure** | Settings → Delete Account | 30 days | Free |
| **Portability** | Email request | 30 days | Free |
| **Withdraw Consent** | Settings → Preferences | Immediate | Free |
| **Complaint** | Email Grievance Officer | 30 days | Free |

---

## 18. Contact Us

**Questions about this Privacy Policy?**

📧 Email: [SUPPORT_EMAIL]
📞 Phone: [PHONE_NUMBER]
🌐 Website: [YOUR_WEBSITE_URL]
🏢 Address: [YOUR_COMPANY_ADDRESS]

**Data Protection Officer:**
- Name: [DPO_NAME]
- Email: [DPO_EMAIL]
- Availability: Monday-Friday, 9 AM - 6 PM IST

---

## 19. DPDP Act Compliance Checklist

- ✅ Data collection on lawful basis only
- ✅ User consent obtained for non-contractual processing
- ✅ Data retention limits enforced
- ✅ User rights implemented (access, correction, erasure, portability)
- ✅ Grievance mechanism in place
- ✅ Data localization requirement met (India-only storage)
- ✅ Security measures documented
- ✅ Third-party DPAs signed
- ✅ Incident response plan in place
- ✅ Audit trails maintained

---

## 20. Jurisdiction & Governing Law

This Privacy Policy is governed by the laws of India, specifically:
- **Digital Personal Data Protection (DPDP) Act, 2023**
- **Information Technology Act, 2000**
- **GST Act, 2017** (for transaction data)

Any dispute related to privacy will be resolved under Indian law and jurisdiction of courts in [YOUR_CITY], [YOUR_STATE].

---

**Last Updated:** [DATE]
**Next Review:** [DATE + 1 YEAR]

---

## Quick Tips for Customization

Replace these placeholders in your Privacy Policy:

- `[YOUR_COMPANY_NAME]` → Your actual company name
- `[YOUR_SERVICE_NAME]` → "Labour Code Auditor", "GST Checker", etc.
- `[YOUR_WEBSITE_URL]` → Your actual website
- `[DATE]` → Current date
- `[REGION]` → Your Supabase region (Mumbai/Singapore/US)
- `[SUPPORT_EMAIL]` → support@yourcompany.com
- `[GRIEVANCE_EMAIL]` → grievance@yourcompany.com
- `[SECURITY_EMAIL]` → security@yourcompany.com
- `[YOUR_GRIEVANCE_OFFICER_NAME]` → Actual officer name
- `[PHONE_NUMBER]` → Your business phone
- `[BILLING_EMAIL]` → billing@yourcompany.com
- `[YOUR_COMPANY_ADDRESS]` → Full mailing address
- `[DPO_NAME]` → Data Protection Officer name (optional, can be you)
- `[DPO_EMAIL]` → DPO email
- `[YOUR_CITY]`, `[YOUR_STATE]` → For jurisdiction

**Publish this on:** Website footer (Privacy Policy link) + welcome email to new users
