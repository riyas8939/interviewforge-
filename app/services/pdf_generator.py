import io
import json
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from app.database.models import Interview

def generate_pdf_report(interview: Interview) -> bytes:
    """
    Generates a professional, beautifully formatted PDF report for the interview.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Styles for Dark Premium Layout
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontSize=24,
        leading=28,
        textColor=colors.HexColor('#0F172A'), # Slate 900
        alignment=0,
        spaceAfter=15
    )
    
    section_style = ParagraphStyle(
        'SectionStyle',
        parent=styles['Heading2'],
        fontSize=16,
        leading=20,
        textColor=colors.HexColor('#1E293B'), # Slate 800
        spaceBefore=15,
        spaceAfter=10
    )
    
    body_style = ParagraphStyle(
        'BodyStyle',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#334155') # Slate 700
    )
    
    meta_style = ParagraphStyle(
        'MetaStyle',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#475569') # Slate 600
    )
    
    header_bar_style = ParagraphStyle(
        'HeaderBarStyle',
        parent=styles['Normal'],
        fontSize=12,
        leading=16,
        textColor=colors.white,
        alignment=1
    )

    story = []
    
    # Header Banner
    banner_data = [[Paragraph("<b>INTERVIEWFORGE - AI EVALUATION REPORT</b>", header_bar_style)]]
    banner_table = Table(banner_data, colWidths=[530])
    banner_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#0F172A')), # Dark Slate
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(banner_table)
    story.append(Spacer(1, 15))
    
    # Title
    story.append(Paragraph(f"Candidate Interview Feedback", title_style))
    story.append(Spacer(1, 5))
    
    # Metadata grid
    meta_data = [
        [Paragraph(f"<b>Role:</b> {interview.role}", meta_style), Paragraph(f"<b>Experience:</b> {interview.experience}", meta_style)],
        [Paragraph(f"<b>Company Style:</b> {interview.company_style}", meta_style), Paragraph(f"<b>Date:</b> {interview.created_at.strftime('%Y-%m-%d %H:%M')}", meta_style)],
        [Paragraph(f"<b>Programming Language:</b> {interview.programming_language}", meta_style), Paragraph(f"<b>Status:</b> {interview.status}", meta_style)]
    ]
    meta_table = Table(meta_data, colWidths=[265, 265])
    meta_table.setStyle(TableStyle([
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('LINEBELOW', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 20))
    
    # Hiring Decision Widget
    rec_color = '#10B981' # Green (Hire)
    if interview.hiring_decision == 'Maybe Hire':
        rec_color = '#F59E0B' # Orange
    elif interview.hiring_decision == 'Needs Improvement':
        rec_color = '#EF4444' # Red
        
    decision_style = ParagraphStyle(
        'DecisionStyle',
        parent=styles['Normal'],
        fontSize=14,
        leading=18,
        textColor=colors.white,
        alignment=1
    )
    
    decision_data = [
        [Paragraph(f"<b>Hiring Recommendation:</b> {interview.hiring_decision or 'N/A'}", decision_style)],
        [Paragraph(f"<font color='white'>{interview.hiring_reasoning or ''}</font>", ParagraphStyle('RecReason', parent=body_style, textColor=colors.white, alignment=1))]
    ]
    decision_table = Table(decision_data, colWidths=[530])
    decision_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor(rec_color)),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('LEFTPADDING', (0,0), (-1,-1), 15),
        ('RIGHTPADDING', (0,0), (-1,-1), 15),
    ]))
    story.append(decision_table)
    story.append(Spacer(1, 20))
    
    # Score Breakdown Table
    story.append(Paragraph("Score Metrics", section_style))
    score_data = [
        [Paragraph("<b>Evaluation Metric</b>", meta_style), Paragraph("<b>Score (%)</b>", meta_style)],
        [Paragraph("Overall Score", body_style), Paragraph(f"{interview.overall_score or 0.0}%", body_style)],
        [Paragraph("Technical Depth", body_style), Paragraph(f"{interview.technical_score or 0.0}%", body_style)],
        [Paragraph("Coding Capability", body_style), Paragraph(f"{interview.coding_score or 0.0}%", body_style)],
        [Paragraph("Communication", body_style), Paragraph(f"{interview.communication_score or 0.0}%", body_style)],
        [Paragraph("Behavioral & Fit", body_style), Paragraph(f"{interview.behavioral_score or 0.0}%", body_style)]
    ]
    score_table = Table(score_data, colWidths=[350, 180])
    score_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F8FAFC')),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
    ]))
    story.append(score_table)
    story.append(Spacer(1, 20))
    
    # Summary, Strengths, Weaknesses
    story.append(Paragraph("AI Executive Summary", section_style))
    story.append(Paragraph(interview.summary or "No summary available.", body_style))
    story.append(Spacer(1, 10))
    
    story.append(Paragraph("Strengths", section_style))
    story.append(Paragraph(interview.strengths or "None noted.", body_style))
    story.append(Spacer(1, 10))
    
    story.append(Paragraph("Weaknesses", section_style))
    story.append(Paragraph(interview.weaknesses or "None noted.", body_style))
    story.append(Spacer(1, 15))
    
    story.append(PageBreak())
    
    # Question & Answer List
    story.append(Paragraph("Question & Answer Evaluation Logs", section_style))
    story.append(Spacer(1, 10))
    
    for idx, q in enumerate(interview.questions, 1):
        story.append(Paragraph(f"<b>Round {idx} - Agent: {q.interviewer_agent}</b>", ParagraphStyle('QAgent', parent=meta_style, fontSize=11, textColor=colors.HexColor('#3B82F6'))))
        story.append(Paragraph(f"<b>Question:</b> {q.question_text}", body_style))
        story.append(Spacer(1, 4))
        
        if q.answer:
            story.append(Paragraph(f"<b>Candidate Answer:</b> {q.answer.answer_text}", body_style))
            story.append(Spacer(1, 4))
            feedback_str = f"Score: {q.answer.score}% | Correctness: {q.answer.correctness}% | Communication: {q.answer.communication}%\nFeedback: {q.answer.suggestions}"
            story.append(Paragraph(f"<i>AI Feedback:</i> {feedback_str}", ParagraphStyle('QFeedback', parent=body_style, textColor=colors.HexColor('#475569'), leftIndent=10)))
        elif q.coding_submission:
            sub = q.coding_submission
            story.append(Paragraph("<b>Submitted Code:</b>", body_style))
            story.append(Paragraph(f"<code>{sub.code}</code>", ParagraphStyle('QCode', parent=body_style, fontName='Courier', fontSize=8, leftIndent=10)))
            story.append(Spacer(1, 4))
            story.append(Paragraph(f"<i>Test Cases:</i> {sub.test_cases_passed}/{sub.test_cases_total} passed.", body_style))
            if sub.code_review_feedback:
                story.append(Paragraph(f"<i>Code Review:</i> {sub.code_review_feedback}", ParagraphStyle('QCodeReview', parent=body_style, textColor=colors.HexColor('#475569'), leftIndent=10)))
                
        story.append(Spacer(1, 15))
        story.append(Paragraph("<hr color='#E2E8F0'/>", body_style))
        story.append(Spacer(1, 15))
        
    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
