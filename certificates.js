// PDF Generation Functions
async function loadPdfTemplate() {
    const response = await fetch('/suzuki-cert.pdf');
    const arrayBuffer = await response.arrayBuffer();
    return arrayBuffer;
}

async function loadFonts() {
    // Fetch Manufacturing Consent font for both name and level text
    const nameResponse = await fetch('https://fonts.gstatic.com/s/manufacturingconsent/v1/N0bL2TVONuFkPkuHfiECSLCwuZS-D-IsakikRw.ttf');
    const nameBuffer = await nameResponse.arrayBuffer();

    return {
        nameFont: new Uint8Array(nameBuffer),
        levelFont: new Uint8Array(nameBuffer) // Using same font as name, just smaller
    };
}

async function generateCertificatePdf(studentName, levelText, templateBytes, fontCache) {
    const { PDFDocument, rgb } = PDFLib;

    // Load template
    const pdfDoc = await PDFDocument.load(templateBytes);

    // Register fontkit to enable custom font embedding
    pdfDoc.registerFontkit(fontkit);

    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();

    // Embed custom fonts (fetched once and cached)
    const nameFont = await pdfDoc.embedFont(fontCache.nameFont);
    const levelFont = await pdfDoc.embedFont(fontCache.levelFont);

    // Add student name (large, centered) - using Manufacturing Consent
    const nameFontSize = 48; // Increased from 36
    const nameWidth = nameFont.widthOfTextAtSize(studentName, nameFontSize);
    const nameX = (width - nameWidth) / 2;
    const nameY = height * 0.50; // Split the difference (was 0.45, then 0.55, now 0.50)

    firstPage.drawText(studentName, {
        x: nameX,
        y: nameY,
        size: nameFontSize,
        font: nameFont,
        color: rgb(0.176, 0.122, 0.078),
        lineHeight: nameFontSize,
        maxWidth: width
    });

    // Add level/song text (small, centered, below name) - using Manufacturing Consent (smaller)
    const levelFontSize = 16;
    const maxLineWidth = width * 0.75; // 75% of page width
    const levelWidth = levelFont.widthOfTextAtSize(levelText, levelFontSize);

    // Check if text is too long and needs to be split into two lines
    if (levelWidth > maxLineWidth) {
        // Split text roughly in the middle by word
        const words = levelText.split(' ');
        const midPoint = Math.floor(words.length / 2);
        const line1 = words.slice(0, midPoint).join(' ');
        const line2 = words.slice(midPoint).join(' ');

        const line1Width = levelFont.widthOfTextAtSize(line1, levelFontSize);
        const line2Width = levelFont.widthOfTextAtSize(line2, levelFontSize);

        const line1X = (width - line1Width) / 2;
        const line2X = (width - line2Width) / 2;
        const lineSpacing = 20; // Small spacing between lines
        const levelY = nameY - 50;

        // Draw first line
        firstPage.drawText(line1, {
            x: line1X,
            y: levelY,
            size: levelFontSize,
            font: levelFont,
            color: rgb(0.290, 0.220, 0.161)
        });

        // Draw second line below
        firstPage.drawText(line2, {
            x: line2X,
            y: levelY - lineSpacing,
            size: levelFontSize,
            font: levelFont,
            color: rgb(0.290, 0.220, 0.161)
        });
    } else {
        // Single line - text fits within 75% width
        const levelX = (width - levelWidth) / 2;
        const levelY = nameY - 50;

        firstPage.drawText(levelText, {
            x: levelX,
            y: levelY,
            size: levelFontSize,
            font: levelFont,
            color: rgb(0.290, 0.220, 0.161)
        });
    }

    // Return as blob
    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
}

function downloadPdf(blob, filename) {
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    // Clean up the URL after a short delay to allow the browser to open it
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Level Transformation Functions
function transformLevel(level) {
    // Extract level number (e.g., "2" from "2. Clementi...")
    const levelMatch = level.match(/^(\d+)\.\s*/);
    const levelNumber = levelMatch ? levelMatch[1] : '';

    // Remove numbering prefix (e.g., "2. ")
    const withoutPrefix = level.replace(/^\d+\.\s*/, '');

    // Check if this is level 8 (has "or" with two alternatives)
    let transformed;
    if (withoutPrefix.includes(' or ')) {
        const alternatives = withoutPrefix.split(' or ');
        transformed = alternatives.map(alt => transformSingleLevel(alt.trim())).join(' or ');
    } else {
        transformed = transformSingleLevel(withoutPrefix);
    }

    // Return formatted as "Level #: Performance of composition by composer"
    return `Level ${levelNumber}: Performance of ${transformed}`;
}

function transformSingleLevel(levelPart) {
    // Extract composer (first word)
    const words = levelPart.split(/\s+/);
    const composer = words[0];

    // Remove volume suffix if it exists (e.g., " - Volume 3")
    let withoutVolume = levelPart.replace(/\s*-\s*Volume\s*\d+$/, '');

    // Remove composer from the beginning
    const composition = withoutVolume.replace(/^\w+\s*/, '').trim();

    // Return formatted as "composition by composer"
    return `${composition} by ${composer}`;
}

async function onGenerate() {
    const textarea = document.getElementById('spreadsheetData');
    const data = textarea.value.trim();

    if (!data) return;

    const rows = data.split('\n');
    let startIndex = 0;

    // Check if first row is header row
    if (rows[0].includes('Student Name') && rows[0].includes('Level')) {
        startIndex = 1;
    }

    const students = [];

    // Parse each data row
    for (let i = startIndex; i < rows.length; i++) {
        const columns = rows[i].split('\t');

        if (columns.length > 4) {
            const studentName = columns[1].trim();
            const level = columns[4].trim();

            if (studentName) {
                const transformedLevel = transformLevel(level);
                students.push({ name: studentName, level: transformedLevel });
            }
        }
    }

    // Hide the form and show progress
    document.getElementById('formContainer').style.display = 'none';
    const description = document.querySelector('.page-description');
    description.textContent = 'Loading fonts and template... Please wait.';

    // Create progress indicator
    const progressDiv = document.createElement('div');
    progressDiv.className = 'progress-container';
    progressDiv.innerHTML = `
        <div class="progress-text">Processing: <span id="progress-count">0</span> of ${students.length}</div>
        <div class="progress-bar">
            <div class="progress-fill" id="progress-fill"></div>
        </div>
    `;
    document.querySelector('.card').appendChild(progressDiv);

    // Load template and fonts once
    const templateBytes = await loadPdfTemplate();
    const fontCache = await loadFonts();

    description.textContent = 'Generating certificates... Please wait.';

    // Generate all PDFs with progress updates
    const certificates = [];
    for (let i = 0; i < students.length; i++) {
        const student = students[i];

        // Update progress
        const progressCount = document.getElementById('progress-count');
        const progressFill = document.getElementById('progress-fill');
        progressCount.textContent = i + 1;
        const percentage = ((i + 1) / students.length) * 100;
        progressFill.style.width = percentage + '%';

        const pdfBlob = await generateCertificatePdf(
            student.name,
            student.level,
            templateBytes,
            fontCache
        );
        certificates.push({ name: student.name, blob: pdfBlob });
    }

    // Remove progress indicator
    progressDiv.remove();

    // Update description
    description.textContent = 'Click a button to download the certificate for each student.';

    // Create download buttons
    const buttonList = document.createElement('ul');
    buttonList.className = 'certificate-links';

    certificates.forEach(cert => {
        const li = document.createElement('li');
        const button = document.createElement('button');
        button.textContent = cert.name; // Removed "Download" prefix
        button.className = 'download-btn';
        button.addEventListener('click', () => {
            downloadPdf(cert.blob, `${cert.name}_Certificate.pdf`);
        });
        li.appendChild(button);
        buttonList.appendChild(li);
    });

    document.querySelector('.card').appendChild(buttonList);
}

document.addEventListener('DOMContentLoaded', function() {
    const textarea = document.getElementById('spreadsheetData');
    const generateBtn = document.getElementById('generateBtn');

    textarea.addEventListener('input', function() {
        generateBtn.disabled = !textarea.value.trim();
    });

    generateBtn.addEventListener('click', async function() {
        generateBtn.disabled = true;
        await onGenerate();
    });
});
