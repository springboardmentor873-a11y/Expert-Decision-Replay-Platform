from typing import Optional
from app.database import DatabaseCursor

def list_decisions():
    with DatabaseCursor() as (c, _):
        c.execute("""SELECT d.*, u.full_name AS creator_name, t.team_name
                     FROM decisions d JOIN users u ON d.created_by=u.id
                     LEFT JOIN teams t ON u.team_id=t.id
                     ORDER BY d.updated_at DESC""")
        return c.fetchall()

def get_decision(decision_id:int):
    with DatabaseCursor() as (c,_):
        c.execute("""SELECT d.*, u.full_name AS creator_name, t.team_name
                     FROM decisions d JOIN users u ON d.created_by=u.id
                     LEFT JOIN teams t ON u.team_id=t.id WHERE d.id=%s""",(decision_id,))
        return c.fetchone()

def create_decision(title, problem_statement, category, status, created_by):
    with DatabaseCursor(commit=True) as (c,_):
        c.execute("""INSERT INTO decisions(title,problem_statement,category,status,created_by)
                     VALUES(%s,%s,%s,%s,%s)""",(title,problem_statement,category,status,created_by))
        return c.lastrowid

def update_decision(decision_id,title,problem_statement,category,status,changed_by):
    with DatabaseCursor(commit=True) as (c,_):
        c.execute("SELECT * FROM decisions WHERE id=%s",(decision_id,))
        old=c.fetchone()
        if not old: return None
        c.execute("SELECT COALESCE(MAX(version_number),0) AS v FROM decision_versions WHERE decision_id=%s",(decision_id,))
        v=c.fetchone()["v"]+1
        c.execute("""INSERT INTO decision_versions(decision_id,version_number,title,problem_statement,category,status,changed_by)
                     VALUES(%s,%s,%s,%s,%s,%s,%s)""",
                  (decision_id,v,old["title"],old["problem_statement"],old["category"],old["status"],changed_by))
        c.execute("""UPDATE decisions SET title=%s,problem_statement=%s,category=%s,status=%s WHERE id=%s""",
                  (title,problem_statement,category,status,decision_id))
    return get_decision(decision_id)

def delete_decision(decision_id):
    with DatabaseCursor(commit=True) as (c,_):
        c.execute("DELETE FROM decisions WHERE id=%s",(decision_id,))
        return c.rowcount>0

def stats():
    with DatabaseCursor() as (c,_):
        c.execute("SELECT COUNT(*) total, SUM(status='Draft') draft, SUM(status='Under Review') review, SUM(status='Approved') approved, SUM(status='Rejected') rejected FROM decisions")
        return c.fetchone()

def list_alternatives(decision_id):
    with DatabaseCursor() as (c,_):
        c.execute("SELECT * FROM decision_alternatives WHERE decision_id=%s ORDER BY created_at DESC",(decision_id,))
        return c.fetchall()

def create_alternative(decision_id, data, user_id):
    with DatabaseCursor(commit=True) as (c,_):
        c.execute("""INSERT INTO decision_alternatives
                     (decision_id,title,description,pros,cons,estimated_cost,feasibility,risk,created_by)
                     VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                  (decision_id,data["title"],data.get("description"),data.get("pros"),data.get("cons"),
                   data.get("estimated_cost"),data.get("feasibility"),data.get("risk"),user_id))
        return c.lastrowid

def update_alternative(alt_id,data):
    with DatabaseCursor(commit=True) as (c,_):
        c.execute("""UPDATE decision_alternatives SET title=%s,description=%s,pros=%s,cons=%s,
                     estimated_cost=%s,feasibility=%s,risk=%s WHERE id=%s""",
                  (data["title"],data.get("description"),data.get("pros"),data.get("cons"),
                   data.get("estimated_cost"),data.get("feasibility"),data.get("risk"),alt_id))
        return c.rowcount>0

def delete_alternative(alt_id):
    with DatabaseCursor(commit=True) as (c,_):
        c.execute("DELETE FROM decision_alternatives WHERE id=%s",(alt_id,))
        return c.rowcount>0

def list_comments(decision_id):
    with DatabaseCursor() as (c,_):
        c.execute("""SELECT dc.*,u.full_name AS author_name,u.role FROM discussion_comments dc
                     JOIN users u ON dc.created_by=u.id WHERE dc.decision_id=%s ORDER BY dc.created_at ASC""",(decision_id,))
        return c.fetchall()

def create_comment(decision_id,text,user_id,parent_id=None):
    with DatabaseCursor(commit=True) as (c,_):
        c.execute("""INSERT INTO discussion_comments(decision_id,parent_id,comment_text,created_by)
                     VALUES(%s,%s,%s,%s)""",(decision_id,parent_id,text,user_id))
        return c.lastrowid

def delete_comment(comment_id,user_id,is_admin=False):
    with DatabaseCursor(commit=True) as (c,_):
        if is_admin:
            c.execute("DELETE FROM discussion_comments WHERE id=%s",(comment_id,))
        else:
            c.execute("DELETE FROM discussion_comments WHERE id=%s AND created_by=%s",(comment_id,user_id))
        return c.rowcount>0

def list_versions(decision_id):
    with DatabaseCursor() as (c,_):
        c.execute("""SELECT v.*,u.full_name AS changed_by_name FROM decision_versions v
                     JOIN users u ON v.changed_by=u.id WHERE v.decision_id=%s ORDER BY v.version_number DESC""",(decision_id,))
        return c.fetchall()

def list_documents(decision_id):
    with DatabaseCursor() as (c,_):
        c.execute("""SELECT d.*,u.full_name AS uploader_name FROM decision_documents d
                     JOIN users u ON d.uploaded_by=u.id WHERE d.decision_id=%s ORDER BY d.uploaded_at DESC""",(decision_id,))
        return c.fetchall()

def get_document(document_id):
    with DatabaseCursor() as (c,_):
        c.execute("SELECT * FROM decision_documents WHERE id=%s",(document_id,))
        return c.fetchone()

def create_document(decision_id, original, stored, path, content_type, size, user_id):
    with DatabaseCursor(commit=True) as (c,_):
        c.execute("""INSERT INTO decision_documents
                     (decision_id,original_filename,stored_filename,file_path,content_type,file_size,uploaded_by)
                     VALUES(%s,%s,%s,%s,%s,%s,%s)""",
                  (decision_id,original,stored,path,content_type,size,user_id))
        return c.lastrowid

def delete_document(document_id,user_id,is_admin=False):
    with DatabaseCursor(commit=True) as (c,_):
        if is_admin:
            c.execute("DELETE FROM decision_documents WHERE id=%s",(document_id,))
        else:
            c.execute("DELETE FROM decision_documents WHERE id=%s AND uploaded_by=%s",(document_id,user_id))
        return c.rowcount>0
