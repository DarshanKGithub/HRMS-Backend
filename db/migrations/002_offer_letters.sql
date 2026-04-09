-- Migration: Add Offer Letters & Templates functionality
-- Description: Support offer letter generation for new hires

-- Create offer_letter_templates table
CREATE TABLE IF NOT EXISTS offer_letter_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create offer_letters table
CREATE TABLE IF NOT EXISTS offer_letters (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  position VARCHAR(100) NOT NULL,
  department VARCHAR(100),
  salary DECIMAL(10,2) NOT NULL,
  offer_date DATE NOT NULL,
  joining_date DATE NOT NULL,
  letter_content TEXT,
  status VARCHAR(20) DEFAULT 'DRAFT', -- DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED
  pdf_path VARCHAR(255),
  validity_days INTEGER DEFAULT 30,
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_offer_status CHECK (status IN ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED'))
);

-- Create audit trail for offer letters
CREATE TABLE IF NOT EXISTS offer_letter_audit (
  id SERIAL PRIMARY KEY,
  offer_id INTEGER NOT NULL REFERENCES offer_letters(id) ON DELETE CASCADE,
  action VARCHAR(50),
  changed_by INTEGER REFERENCES users(id),
  old_status VARCHAR(20),
  new_status VARCHAR(20),
  notes TEXT,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_offer_letters_employee_id ON offer_letters(employee_id);
CREATE INDEX IF NOT EXISTS idx_offer_letters_status ON offer_letters(status);
CREATE INDEX IF NOT EXISTS idx_offer_letters_created_by ON offer_letters(created_by);
CREATE INDEX IF NOT EXISTS idx_offer_letters_created_at ON offer_letters(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_offer_letter_audit_offer_id ON offer_letter_audit(offer_id);
CREATE INDEX IF NOT EXISTS idx_offer_letter_templates_active ON offer_letter_templates(is_active);

-- Insert default offer letter template
INSERT INTO offer_letter_templates (name, content, is_active) VALUES (
  'Standard Offer Letter',
  '{{COMPANY_NAME}}

Dear {{EMPLOYEE_NAME}},

We are pleased to extend an offer of employment for the position of {{POSITION}} in the {{DEPARTMENT}} department.

Position: {{POSITION}}
Department: {{DEPARTMENT}}
Annual Salary: {{SALARY}}
Offer Date: {{OFFER_DATE}}
Joining Date: {{JOINING_DATE}}

Terms and Conditions:
1. This offer is contingent upon the successful completion of background verification and medical examination.
2. You will be subject to the company policies and procedures.
3. Your employment will be at-will unless otherwise specified.
4. This offer is valid for 30 days from the offer date.

Please confirm your acceptance by signing and returning this letter.

Best Regards,
Human Resources Department
{{COMPANY_NAME}}',
  TRUE
);
