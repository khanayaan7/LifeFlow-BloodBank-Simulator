import os

from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from twilio.rest import Client


def send_email_alert(subject: str, body_html: str):
    api_key = os.getenv("SENDGRID_API_KEY")
    sender = os.getenv("SENDGRID_SENDER_EMAIL")
    recipient = os.getenv("ALERT_EMAIL") or sender
    if not api_key or not sender:
        return False
    message = Mail(from_email=sender, to_emails=recipient, subject=subject, html_content=body_html)
    try:
        client = SendGridAPIClient(api_key)
        client.send(message)
        print(f"[ALERT][EMAIL] Sent: {subject}")
        return True
    except Exception as exc:
        print(f"[ALERT][EMAIL] Failed: {exc}")
        return False


def send_sms_alert(message: str):
    sid = os.getenv("TWILIO_ACCOUNT_SID")
    token = os.getenv("TWILIO_AUTH_TOKEN")
    from_no = os.getenv("TWILIO_PHONE_NUMBER")
    to_no = os.getenv("ALERT_PHONE_NUMBER")
    if not all([sid, token, from_no, to_no]):
        return False
    try:
        client = Client(sid, token)
        client.messages.create(body=message, from_=from_no, to=to_no)
        print("[ALERT][SMS] Sent")
        return True
    except Exception as exc:
        print(f"[ALERT][SMS] Failed: {exc}")
        return False


def send_cold_chain_violation_email(violation):
    subject = f"Cold Chain Violation - {violation.storage_unit_id}"
    body = f"""
    <h3>Cold Chain Violation Alert</h3>
    <table border=\"1\" cellpadding=\"8\" cellspacing=\"0\">
      <tr><th>Storage Unit</th><td>{violation.storage_unit_id}</td></tr>
      <tr><th>Temperature</th><td>{violation.temperature_c}</td></tr>
      <tr><th>Duration (min)</th><td>{violation.duration_minutes}</td></tr>
      <tr><th>Severity</th><td>{violation.severity.value}</td></tr>
      <tr><th>Time</th><td>{violation.created_at}</td></tr>
    </table>
    """
    return send_email_alert(subject, body)


def send_cold_chain_sms(violation):
    message = (
        f"ALERT: Cold chain violation at {violation.storage_unit_id}. "
        f"Temp: {violation.temperature_c}C. Severity: {violation.severity.value}."
    )
    return send_sms_alert(message)


def send_expiry_summary_email(expiring_units: list):
    subject = f"Daily Blood Expiry Report - {len(expiring_units)} units expiring"
    rows = "".join(
        f"<tr><td>{u.unit_code}</td><td>{u.blood_group.value}</td><td>{u.expiry_date}</td></tr>"
        for u in expiring_units
    )
    body = f"""
    <h3>Daily Expiry Summary</h3>
    <table border=\"1\" cellpadding=\"8\" cellspacing=\"0\">
      <tr><th>Unit Code</th><th>Blood Group</th><th>Expiry Date</th></tr>
      {rows}
    </table>
    """
    return send_email_alert(subject, body)
