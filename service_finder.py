import argparse
import sqlite3
from datetime import datetime

# CONFIGURATION
DB_NAME = 'service_finder.db'
USER_ID = 1

def get_db_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def setup_database():
    """Checks if DB exists; if not, builds the schema and seeds data."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Create Tables (IF NOT EXISTS prevents errors)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS User_Profile (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        total_hours_required REAL NOT NULL,
        deadline_date DATE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS Agencies (
        agency_id INTEGER PRIMARY KEY AUTOINCREMENT,
        agency_name TEXT NOT NULL,
        category TEXT,
        location_address TEXT,
        contact_name TEXT,
        contact_phone TEXT,
        website_url TEXT
    );
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS Service_Logs (
        log_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        agency_id INTEGER,
        service_date DATE NOT NULL,
        hours_worked REAL NOT NULL,
        task_description TEXT,
        supervisor_name TEXT,
        is_verified BOOLEAN DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES User_Profile(user_id),
        FOREIGN KEY (agency_id) REFERENCES Agencies(agency_id)
    );
    """)
    
    # 2. Check if User exists. If not, INSERT (Reset logic).
    cursor.execute("SELECT count(*) FROM User_Profile")
    if cursor.fetchone()[0] == 0:
        print("⚙️ Initializing System... Creating User Profile.")
        cursor.execute("""
            INSERT INTO User_Profile (full_name, total_hours_required, deadline_date) 
            VALUES ('Timothy Wheels', 40.0, '2026-01-17')
        """)
        
    # 3. Check if Agencies exist. If not, INSERT.
    cursor.execute("SELECT count(*) FROM Agencies")
    if cursor.fetchone()[0] == 0:
        print("⚙️ Initializing System... Adding Agencies.")
        cursor.execute("""
        INSERT INTO Agencies (agency_name, category, location_address, contact_name) 
        VALUES 
            ('Atlanta Community Food Bank', 'Food Service', '732 Joseph E. Lowery Blvd', 'Sarah J.'),
            ('DeKalb County Library', 'Education', '215 Sycamore St', 'Mr. Henderson'),
            ('Trees Atlanta', 'Environment', '225 Chester Ave', 'Marcus G.')
        """)
        
    conn.commit()
    conn.close()

def show_status():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # The "Burn Rate" Logic
    query = """
    SELECT 
        u.total_hours_required AS Goal,
        IFNULL(SUM(s.hours_worked), 0) AS Completed,
        (u.total_hours_required - IFNULL(SUM(s.hours_worked), 0)) AS Remaining,
        ROUND(julianday(u.deadline_date) - julianday('now'), 2) AS Days_Left
    FROM User_Profile u
    LEFT JOIN Service_Logs s ON u.user_id = s.user_id
    WHERE u.user_id = ?
    """
    
    cursor.execute(query, (USER_ID,))
    result = cursor.fetchone()
    conn.close()

    if result:
        goal = result['Goal']
        done = result['Completed']
        left = result['Remaining']
        days = result['Days_Left']
        
        # Avoid division by zero if deadline passed
        if days > 0:
            rate = round(left / days, 1)
        else:
            rate = "CRITICAL (Deadline Passed)"

        print(f"\n--- 🚨 STATUS REPORT ---")
        print(f"Goal:      {goal} hrs")
        print(f"Completed: {done} hrs")
        print(f"Remaining: {left} hrs")
        print(f"Days Left: {days}")
        print(f"BURN RATE: {rate} hrs/day needed")
        print("------------------------\n")

def log_hours():
    print("\n--- 📝 LOG HOURS ---")
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT agency_id, agency_name FROM Agencies")
    agencies = cursor.fetchall()
    
    for agency in agencies:
        print(f"[{agency['agency_id']}] {agency['agency_name']}")
    
    try:
        agency_id = int(input("Enter Agency ID: "))
        hours = float(input("Hours Worked: "))
        desc = input("Task Description: ")
        date = input("Date (YYYY-MM-DD) [Press Enter for Today]: ")
        
        if not date:
            date = datetime.now().strftime("%Y-%m-%d")

        cursor.execute("""
            INSERT INTO Service_Logs (user_id, agency_id, service_date, hours_worked, task_description, is_verified)
            VALUES (?, ?, ?, ?, ?, 0)
        """, (USER_ID, agency_id, date, hours, desc))
        
        conn.commit()
        print("✅ Hours logged successfully!")
        
    except ValueError:
        print("❌ Invalid input. Please enter numbers.")
    finally:
        conn.close()

def log_hours_entry(agency_id, hours, desc, date=None):
    conn = get_db_connection()
    cursor = conn.cursor()

    if not date:
        date = datetime.now().strftime("%Y-%m-%d")

    cursor.execute("""
        INSERT INTO Service_Logs (user_id, agency_id, service_date, hours_worked, task_description, is_verified)
        VALUES (?, ?, ?, ?, ?, 0)
    """, (USER_ID, agency_id, date, hours, desc))

    conn.commit()
    conn.close()

def generate_report():
    print("\n--- 🖨️ GENERATING COMPLIANCE REPORT ---")
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM User_Profile WHERE user_id = ?", (USER_ID,))
    user = cursor.fetchone()
    
    query = """
    SELECT s.service_date, a.agency_name, s.hours_worked, s.task_description, s.is_verified
    FROM Service_Logs s
    JOIN Agencies a ON s.agency_id = a.agency_id
    WHERE s.user_id = ?
    ORDER BY s.service_date ASC
    """
    cursor.execute(query, (USER_ID,))
    logs = cursor.fetchall()
    conn.close()

    # Build Report
    report_lines = []
    report_lines.append("="*60)
    report_lines.append(f"COMMUNITY SERVICE TIMESHEET: {user['full_name']}")
    report_lines.append(f"DEADLINE: {user['deadline_date']}")
    report_lines.append(f"GENERATED: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    report_lines.append("="*60)
    report_lines.append(f"{'DATE':<12} | {'AGENCY':<20} | {'HRS':<5} | {'TASK'}")
    report_lines.append("-" * 60)
    
    total_hours = 0
    for log in logs:
        status = "✅" if log['is_verified'] else "⚠️"
        line = f"{log['service_date']:<12} | {log['agency_name']:<20} | {log['hours_worked']:<5} | {log['task_description']} {status}"
        report_lines.append(line)
        total_hours += log['hours_worked']
        
    report_lines.append("-" * 60)
    report_lines.append(f"TOTAL HOURS COMPLETED: {total_hours}")
    report_lines.append(f"HOURS REMAINING:       {user['total_hours_required'] - total_hours}")
    report_lines.append("="*60)
    report_lines.append("\n\n______________________________          ______________________________")
    report_lines.append("Supervisor Signature                    Date")

    report_content = "\n".join(report_lines)
    print(report_content)
    
    filename = f"Timesheet_{datetime.now().strftime('%Y%m%d')}.txt"
    with open(filename, "w") as f:
        f.write(report_content)
    print(f"\n[💾 Saved to {filename}]")

def parse_log_entry(entry):
    parts = [part.strip() for part in entry.split("|")]
    if len(parts) < 3 or len(parts) > 4:
        raise ValueError("Log entry must be: agency_id|hours|description|date(optional)")

    agency_id = int(parts[0])
    hours = float(parts[1])
    desc = parts[2]
    date = parts[3] if len(parts) == 4 and parts[3] else None
    return agency_id, hours, desc, date

def main():
    # AUTO-FIX: Ensure DB exists before menu loads
    setup_database()
    
    parser = argparse.ArgumentParser(description="Service Finder CLI")
    parser.add_argument(
        "--log",
        action="append",
        help="Log hours: agency_id|hours|description|date(optional YYYY-MM-DD)",
    )
    parser.add_argument("--report", action="store_true", help="Generate compliance report")
    parser.add_argument("--status", action="store_true", help="Show burn rate status")
    args = parser.parse_args()

    if args.log or args.report or args.status:
        if args.log:
            for entry in args.log:
                agency_id, hours, desc, date = parse_log_entry(entry)
                log_hours_entry(agency_id, hours, desc, date)
        if args.status:
            show_status()
        if args.report:
            generate_report()
        return

    while True:
        print("\n--- SERVICE FINDER v1.0 (Auto-Fix Enabled) ---")
        print("1. Show Status (Burn Rate)")
        print("2. Log Hours")
        print("3. Generate Compliance Report")
        print("4. Exit")
        choice = input("Select an option: ")
        
        if choice == '1':
            show_status()
        elif choice == '2':
            log_hours()
        elif choice == '3':
            generate_report()
        elif choice == '4':
            print("Stay focused. You got this.")
            break
        else:
            print("Invalid selection.")

if __name__ == "__main__":
    main()
