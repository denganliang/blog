document.addEventListener('DOMContentLoaded', function() {
  // Initialize EasyMDE
  const easyMDE = new EasyMDE({
    element: document.getElementById('markdown-editor'),
    autoDownloadFontAwesome: true,
    spellChecker: false,
    autosave: {
      enabled: true,
      uniqueId: "markdown-editor-content",
      delay: 1000,
    },
    toolbar: [
      "bold", "italic", "heading", "|",
      "quote", "unordered-list", "ordered-list", "|",
      "link", "image", "|",
      "preview", "side-by-side", "fullscreen", "|",
      "guide"
    ],
    placeholder: "Type your markdown here...",
    minHeight: "500px",
  });

  // Helper function to download a blob
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Export Markdown
  document.getElementById('export-md').addEventListener('click', function() {
    const markdown = easyMDE.value();
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    downloadBlob(blob, 'document.md');
  });

  // Export PDF
  document.getElementById('export-pdf').addEventListener('click', function() {
    const markdown = easyMDE.value();
    // Render Markdown to HTML using EasyMDE's internal parser (marked)
    const htmlContent = easyMDE.markdown(markdown);

    // Create a temporary container for styling the PDF content
    const element = document.createElement('div');
    element.innerHTML = `
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        h1, h2, h3, h4, h5, h6 { color: #2c3e50; margin-top: 1.5em; margin-bottom: 0.5em; }
        code { background-color: #f8f9fa; padding: 2px 4px; border-radius: 4px; font-family: monospace; }
        pre { background-color: #f8f9fa; padding: 1em; border-radius: 4px; overflow-x: auto; }
        blockquote { border-left: 4px solid #e9ecef; margin: 0; padding-left: 1em; color: #6c757d; }
        img { max-width: 100%; height: auto; }
        table { border-collapse: collapse; width: 100%; margin: 1em 0; }
        th, td { border: 1px solid #dee2e6; padding: 8px; text-align: left; }
        th { background-color: #f8f9fa; }
      </style>
      <div class="markdown-body">
        ${htmlContent}
      </div>
    `;

    const opt = {
      margin:       1,
      filename:     'document.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    // Use html2pdf library
    html2pdf().set(opt).from(element).save();
  });

  // Export Word
  document.getElementById('export-word').addEventListener('click', function() {
    const markdown = easyMDE.value();
    const htmlContent = easyMDE.markdown(markdown);

    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
      </html>
    `;

    // Use html-docx-js library
    // html-docx-js might be exposed as 'htmlDocx' or similar depending on the build
    // Assuming 'htmlDocx' is available globally
    if (typeof htmlDocx !== 'undefined') {
      const converted = htmlDocx.asBlob(content);
      downloadBlob(converted, 'document.docx');
    } else {
      console.error('html-docx-js library not loaded');
      alert('Error: Export library not loaded.');
    }
  });
});
