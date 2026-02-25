import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface YouthApplicationData {
  // Unit Info
  unitType: string;      // Pack/Troop/Crew/Ship
  unitNumber: string;
  councilName: string;
  district: string;
  
  // Applicant Info
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  nickname: string;
  gender: string;
  dateOfBirth: string;    // MM/DD/YYYY
  grade: number;          // 0-12
  school: string;
  
  // Address
  country: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  
  // Parent/Guardian
  parentName: string;
  parentRelationship: string;
  parentDOB: string;
  parentOccupation: string;
  parentEmployer: string;
  parentEmail: string;
  parentPhone: string;
  
  // Background
  previousScouting: boolean;
  
  // Signature
  signature: string;      // Base64 image or text
  signatureDate: string;
}

interface AdultApplicationData {
  // Registration Info
  position: string;
  positionCode: string;
  
  // Personal Info
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  ssn: string;
  dateOfBirth: string;
  gender: string;
  driversLicense: string;
  driversLicenseState: string;
  occupation: string;
  employer: string;
  
  // Contact Info
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;
  homePhone: string;
  businessPhone: string;
  email: string;
  
  // Background Questions (6 yes/no)
  backgroundQuestion1: boolean;
  backgroundQuestion2: boolean;
  backgroundQuestion3: boolean;
  backgroundQuestion4: boolean;
  backgroundQuestion5: boolean;
  backgroundQuestion6: boolean;
  
  // Experience
  eagleScout: boolean;
  previousPositions: string;
  currentMemberships: string;
  
  // References
  reference1Name: string;
  reference1Address: string;
  reference1Phone: string;
  reference2Name: string;
  reference2Address: string;
  reference2Phone: string;
  reference3Name: string;
  reference3Address: string;
  reference3Phone: string;
  
  // Legal
  religiousPrinciple: string;
  codeOfConduct: string;
  
  // Signature
  signature: string;
  signatureDate: string;
}

/**
 * Generate a filled BSA Youth Application (Form 524-406)
 * Returns the PDF as a Uint8Array
 */
export async function generateYouthApplication(data: YouthApplicationData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage();
  const { width, height } = page.getSize();
  
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  
  const fontSize = 10;
  const margin = 50;
  let y = height - margin;
  
  // Title
  page.drawText('BSA YOUTH APPLICATION (Form 524-406)', {
    x: margin,
    y,
    size: 14,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  y -= 30;
  
  // Unit Information
  page.drawText('UNIT INFORMATION', { x: margin, y, size: 12, font: fontBold });
  y -= 20;
  
  const unitFields = [
    ['Unit Type:', data.unitType, 'Council:', data.councilName],
    ['Unit #:', data.unitNumber, 'District:', data.district],
  ];
  
  for (const row of unitFields) {
    page.drawText(row[0], { x: margin, y, size: fontSize, font });
    page.drawText(row[1] || '', { x: margin + 60, y, size: fontSize, font });
    page.drawText(row[2], { x: width / 2, y, size: fontSize, font });
    page.drawText(row[3] || '', { x: width / 2 + 50, y, size: fontSize, font });
    y -= 18;
  }
  y -= 15;
  
  // Applicant Information
  page.drawText('APPLICANT INFORMATION', { x: margin, y, size: 12, font: fontBold });
  y -= 20;
  
  const applicantFields = [
    ['First Name:', data.firstName, 'Middle:', data.middleName],
    ['Last Name:', data.lastName, 'Suffix:', data.suffix],
    ['Nickname:', data.nickname, 'Gender:', data.gender],
    ['Date of Birth:', data.dateOfBirth, 'Grade:', String(data.grade)],
    ['School:', data.school],
  ];
  
  for (const row of applicantFields) {
    page.drawText(row[0], { x: margin, y, size: fontSize, font });
    page.drawText(row[1] || '', { x: margin + 80, y, size: fontSize, font });
    if (row[2]) {
      page.drawText(row[2], { x: width / 2, y, size: fontSize, font });
      page.drawText(row[3] || '', { x: width / 2 + 60, y, size: fontSize, font });
    }
    y -= 18;
  }
  y -= 15;
  
  // Address
  page.drawText('ADDRESS', { x: margin, y, size: 12, font: fontBold });
  y -= 20;
  
  page.drawText('Country:', { x: margin, y, size: fontSize, font });
  page.drawText(data.country || 'USA', { x: margin + 60, y, size: fontSize, font });
  y -= 18;
  
  page.drawText('Street Address:', { x: margin, y, size: fontSize, font });
  page.drawText(data.addressLine1 || '', { x: margin + 90, y, size: fontSize, font });
  y -= 18;
  
  if (data.addressLine2) {
    page.drawText('Address Line 2:', { x: margin, y, size: fontSize, font });
    page.drawText(data.addressLine2, { x: margin + 90, y, size: fontSize, font });
    y -= 18;
  }
  
  page.drawText('City:', { x: margin, y, size: fontSize, font });
  page.drawText(data.city || '', { x: margin + 40, y, size: fontSize, font });
  page.drawText('State:', { x: width / 3, y, size: fontSize, font });
  page.drawText(data.state || '', { x: width / 3 + 40, y, size: fontSize, font });
  page.drawText('ZIP:', { x: width / 2 + 40, y, size: fontSize, font });
  page.drawText(data.zipCode || '', { x: width / 2 + 60, y, size: fontSize, font });
  y -= 18;
  
  page.drawText('Phone:', { x: margin, y, size: fontSize, font });
  page.drawText(data.phone || '', { x: margin + 40, y, size: fontSize, font });
  y -= 25;
  
  // Parent/Guardian
  page.drawText('PARENT/GUARDIAN INFORMATION', { x: margin, y, size: 12, font: fontBold });
  y -= 20;
  
  const parentFields = [
    ['Name:', data.parentName, 'Relationship:', data.parentRelationship],
    ['Date of Birth:', data.parentDOB, 'Occupation:', data.parentOccupation],
    ['Employer:', data.parentEmployer],
    ['Email:', data.parentEmail],
    ['Phone:', data.parentPhone],
  ];
  
  for (const row of parentFields) {
    page.drawText(row[0], { x: margin, y, size: fontSize, font });
    page.drawText(row[1] || '', { x: margin + 40, y, size: fontSize, font });
    if (row[2]) {
      page.drawText(row[2], { x: width / 2, y, size: fontSize, font });
      page.drawText(row[3] || '', { x: width / 2 + 80, y, size: fontSize, font });
    }
    y -= 18;
  }
  y -= 25;
  
  // Background
  page.drawText('BACKGROUND', { x: margin, y, size: 12, font: fontBold });
  y -= 20;
  
  page.drawText('Previous Scouting Experience:', { x: margin, y, size: fontSize, font });
  page.drawText(data.previousScouting ? 'Yes' : 'No', { x: margin + 160, y, size: fontSize, font });
  y -= 30;
  
  // Signature
  page.drawText('PARENT/GUARDIAN SIGNATURE', { x: margin, y, size: 12, font: fontBold });
  y -= 20;
  
  if (data.signature) {
    try {
      // If signature is a base64 image, embed it
      if (data.signature.startsWith('data:')) {
        const base64Data = data.signature.split(',')[1];
        const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        const image = await pdf.embedPng(imageBytes);
        page.drawImage(image, {
          x: margin,
          y: y - 40,
          width: 150,
          height: 40,
        });
      } else {
        // Text signature
        page.drawText(data.signature, {
          x: margin,
          y,
          size: 16,
          font: fontBold,
          color: rgb(0, 0, 0),
        });
      }
    } catch (e) {
      console.error('Error embedding signature:', e);
    }
  }
  
  page.drawText('Date:', { x: margin + 180, y, size: fontSize, font });
  page.drawText(data.signatureDate || '', { x: margin + 210, y, size: fontSize, font });
  
  return await pdf.save();
}

/**
 * Generate a filled BSA Adult Application (Form 524-501)
 */
export async function generateAdultApplication(data: AdultApplicationData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage();
  const { width, height } = page.getSize();
  
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  
  const fontSize = 10;
  const margin = 50;
  let y = height - margin;
  
  // Title
  page.drawText('BSA ADULT APPLICATION (Form 524-501)', {
    x: margin,
    y,
    size: 14,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  y -= 30;
  
  // Registration Info
  page.drawText('REGISTRATION INFORMATION', { x: margin, y, size: 12, font: fontBold });
  y -= 20;
  
  page.drawText('Position:', { x: margin, y, size: fontSize, font });
  page.drawText(data.position || '', { x: margin + 60, y, size: fontSize, font });
  page.drawText('Position Code:', { x: width / 2, y, size: fontSize, font });
  page.drawText(data.positionCode || '', { x: width / 2 + 85, y, size: fontSize, font });
  y -= 25;
  
  // Personal Info
  page.drawText('PERSONAL INFORMATION', { x: margin, y, size: 12, font: fontBold });
  y -= 20;
  
  const personalFields = [
    ['First Name:', data.firstName, 'Middle:', data.middleName],
    ['Last Name:', data.lastName, 'Suffix:', data.suffix],
    ['SSN:', data.ssn, 'Date of Birth:', data.dateOfBirth],
    ['Gender:', data.gender],
    ['Driver\'s License:', data.driversLicense, 'State:', data.driversLicenseState],
    ['Occupation:', data.occupation],
    ['Employer:', data.employer],
  ];
  
  for (const row of personalFields) {
    page.drawText(row[0], { x: margin, y, size: fontSize, font });
    page.drawText(row[1] || '', { x: margin + 70, y, size: fontSize, font });
    if (row[2]) {
      page.drawText(row[2], { x: width / 2, y, size: fontSize, font });
      page.drawText(row[3] || '', { x: width / 2 + 80, y, size: fontSize, font });
    }
    y -= 18;
  }
  y -= 15;
  
  // Contact Info
  page.drawText('CONTACT INFORMATION', { x: margin, y, size: 12, font: fontBold });
  y -= 20;
  
  page.drawText('Street Address:', { x: margin, y, size: fontSize, font });
  page.drawText(data.addressLine1 || '', { x: margin + 90, y, size: fontSize, font });
  y -= 18;
  
  page.drawText('City:', { x: margin, y, size: fontSize, font });
  page.drawText(data.city || '', { x: margin + 40, y, size: fontSize, font });
  page.drawText('State:', { x: width / 3, y, size: fontSize, font });
  page.drawText(data.state || '', { x: width / 3 + 40, y, size: fontSize, font });
  page.drawText('ZIP:', { x: width / 2 + 40, y, size: fontSize, font });
  page.drawText(data.zipCode || '', { x: width / 2 + 60, y, size: fontSize, font });
  y -= 18;
  
  page.drawText('Home Phone:', { x: margin, y, size: fontSize, font });
  page.drawText(data.homePhone || '', { x: margin + 70, y, size: fontSize, font });
  page.drawText('Business Phone:', { x: width / 2, y, size: fontSize, font });
  page.drawText(data.businessPhone || '', { x: width / 2 + 90, y, size: fontSize, font });
  y -= 18;
  
  page.drawText('Email:', { x: margin, y, size: fontSize, font });
  page.drawText(data.email || '', { x: margin + 40, y, size: fontSize, font });
  y -= 25;
  
  // Background Questions
  page.drawText('BACKGROUND QUESTIONS', { x: margin, y, size: 12, font: fontBold });
  y -= 20;
  
  const questions = [
    data.backgroundQuestion1 ? '☐' : '☒',
    'Have you ever been convicted of a crime?',
    data.backgroundQuestion2 ? '☐' : '☒',
    'Have you ever had a youth membership denied or terminated?',
    data.backgroundQuestion3 ? '☐' : '☒',
    'Do you have any substance abuse issues?',
    data.backgroundQuestion4 ? '☐' : '☒',
    'Have you ever been a registered Sex Offender?',
    data.backgroundQuestion5 ? '☐' : '☒',
    'Do you agree to the Youth Protection guidelines?',
    data.backgroundQuestion6 ? '☐' : '☒',
    'Do you agree to the Scouter Code of Conduct?',
  ];
  
  for (let i = 0; i < questions.length; i += 2) {
    page.drawText(questions[i], { x: margin, y, size: fontSize, font });
    page.drawText(questions[i + 1], { x: margin + 20, y, size: fontSize, font });
    y -= 16;
  }
  y -= 15;
  
  // Experience
  page.drawText('EXPERIENCE', { x: margin, y, size: 12, font: fontBold });
  y -= 20;
  
  page.drawText('Eagle Scout:', { x: margin, y, size: fontSize, font });
  page.drawText(data.eagleScout ? 'Yes' : 'No', { x: margin + 75, y, size: fontSize, font });
  y -= 18;
  
  if (data.previousPositions) {
    page.drawText('Previous Positions:', { x: margin, y, size: fontSize, font });
    y -= 16;
    page.drawText(data.previousPositions, { x: margin, y, size: 8, font });
    y -= 18;
  }
  
  if (data.currentMemberships) {
    page.drawText('Current Memberships:', { x: margin, y, size: fontSize, font });
    y -= 16;
    page.drawText(data.currentMemberships, { x: margin, y, size: 8, font });
  }
  
  return await pdf.save();
}
