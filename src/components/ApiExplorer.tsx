import React, { useState } from 'react';
import { Code2, Terminal, Play, Copy, Check, FileText, Send, Download, ArrowRight, ShieldCheck } from 'lucide-react';
import { PdfaConformanceLevel } from '../types';

export const ApiExplorer: React.FC = () => {
  const [activeLang, setActiveLang] = useState<'curl' | 'js' | 'python' | 'node'>('curl');
  const [copied, setCopied] = useState(false);
  const [requestFormat, setRequestFormat] = useState<'multipart' | 'json'>('multipart');
  const [returnType, setReturnType] = useState<'binary' | 'json'>('binary');

  // Interactive Live Tester state
  const [testTitle, setTestTitle] = useState('Quarterly Archival Report');
  const [testAuthor, setTestAuthor] = useState('API Client Application');
  const [testConformance, setTestConformance] = useState<PdfaConformanceLevel>('PDF/A-2b');
  const [testFile, setTestFile] = useState<File | null>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiResult, setApiResult] = useState<{
    status: number;
    timeMs: number;
    headers: Record<string, string>;
    jsonResponse?: any;
    pdfBlobUrl?: string;
  } | null>(null);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  // Code Snippet Generators
  const getCurlSnippet = () => {
    if (requestFormat === 'multipart') {
      if (returnType === 'binary') {
        return `# Convert PDF to PDF/A and save returned binary file directly
curl -X POST "${baseUrl}/api/convert-pdfa?download=true" \\
  -F "file=@document.pdf" \\
  -F "title=${testTitle}" \\
  -F "author=${testAuthor}" \\
  -F "conformanceLevel=${testConformance}" \\
  --output "converted-pdfa.pdf"`;
      }
      return `# Convert PDF to PDF/A and return JSON with base64 PDF & compliance report
curl -X POST "${baseUrl}/api/convert-pdfa" \\
  -H "Accept: application/json" \\
  -F "file=@document.pdf" \\
  -F "title=${testTitle}" \\
  -F "author=${testAuthor}" \\
  -F "conformanceLevel=${testConformance}"`;
    }

    return `# Convert PDF via Base64 JSON API Payload
curl -X POST "${baseUrl}/api/convert-pdfa" \\
  -H "Content-Type: application/json" \\
  -d '{
    "pdfBase64": "JVBERi0xLj...[BASE64_STRING]...",
    "metadata": {
      "title": "${testTitle}",
      "author": "${testAuthor}",
      "conformanceLevel": "${testConformance}"
    }
  }'`;
  };

  const getJsSnippet = () => {
    if (requestFormat === 'multipart') {
      return `// JavaScript / Fetch (Multipart Form Data)
const formData = new FormData();
formData.append('file', pdfFileBlob, 'document.pdf');
formData.append('title', '${testTitle}');
formData.append('author', '${testAuthor}');
formData.append('conformanceLevel', '${testConformance}');

// Fetch converted PDF/A binary file directly
const response = await fetch('${baseUrl}/api/convert-pdfa?download=true', {
  method: 'POST',
  body: formData,
});

if (response.ok) {
  const blob = await response.blob();
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = 'converted-pdfa.pdf';
  a.click();
}`;
    }

    return `// JavaScript / Fetch (JSON Payload with Base64)
const response = await fetch('${baseUrl}/api/convert-pdfa', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    pdfBase64: base64String,
    metadata: {
      title: '${testTitle}',
      author: '${testAuthor}',
      conformanceLevel: '${testConformance}'
    }
  })
});

const data = await response.json();
console.log('PDF/A Conformance Score:', data.complianceReport.score);
console.log('PDF/A Base64:', data.pdfBase64);`;
  };

  const getPythonSnippet = () => {
    return `# Python (requests library)
import requests

url = "${baseUrl}/api/convert-pdfa?download=true"

files = {
    'file': ('document.pdf', open('document.pdf', 'rb'), 'application/pdf')
}
data = {
    'title': '${testTitle}',
    'author': '${testAuthor}',
    'conformanceLevel': '${testConformance}'
}

response = requests.post(url, files=files, data=data)

if response.status_code == 200:
    with open('output-pdfa.pdf', 'wb') as f:
        f.write(response.content)
    print("Successfully received PDF/A archival file!")`;
  };

  const getNodeSnippet = () => {
    return `// Node.js (Axios / FormData)
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const form = new FormData();
form.append('file', fs.createReadStream('./document.pdf'));
form.append('title', '${testTitle}');
form.append('author', '${testAuthor}');
form.append('conformanceLevel', '${testConformance}');

const response = await axios.post('${baseUrl}/api/convert-pdfa?download=true', form, {
  headers: form.getHeaders(),
  responseType: 'arraybuffer'
});

fs.writeFileSync('./converted-pdfa.pdf', response.data);
console.log('Saved PDF/A archival file successfully!');`;
  };

  const currentSnippet = () => {
    switch (activeLang) {
      case 'curl':
        return getCurlSnippet();
      case 'js':
        return getJsSnippet();
      case 'python':
        return getPythonSnippet();
      case 'node':
        return getNodeSnippet();
      default:
        return getCurlSnippet();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentSnippet());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Run Live API Test
  const runLiveApiTest = async () => {
    setApiLoading(true);
    setApiResult(null);
    const startTime = performance.now();

    try {
      let fileToUpload: Blob = testFile || new Blob(['fake pdf'], { type: 'application/pdf' });

      // If user hasn't selected a file, generate sample PDF via quick convert logic
      if (!testFile) {
        const { createSamplePdf } = await import('../lib/pdfa-converter');
        const sampleBytes = await createSamplePdf();
        fileToUpload = new Blob([sampleBytes], { type: 'application/pdf' });
      }

      const formData = new FormData();
      formData.append('file', fileToUpload, testFile ? testFile.name : 'sample-test.pdf');
      formData.append('title', testTitle);
      formData.append('author', testAuthor);
      formData.append('conformanceLevel', testConformance);

      const endpoint = returnType === 'binary' ? `${baseUrl}/api/convert-pdfa?download=true` : `${baseUrl}/api/convert-pdfa`;

      const headersInit: Record<string, string> = {};
      if (returnType === 'json') {
        headersInit['Accept'] = 'application/json';
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: headersInit,
        body: formData,
      });

      const endTime = performance.now();
      const timeMs = Math.round(endTime - startTime);

      const resHeaders: Record<string, string> = {};
      response.headers.forEach((val, key) => {
        resHeaders[key] = val;
      });

      if (returnType === 'binary') {
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        setApiResult({
          status: response.status,
          timeMs,
          headers: resHeaders,
          pdfBlobUrl: blobUrl,
        });
      } else {
        const json = await response.json();
        setApiResult({
          status: response.status,
          timeMs,
          headers: resHeaders,
          jsonResponse: json,
        });
      }
    } catch (err: any) {
      setApiResult({
        status: 500,
        timeMs: 0,
        headers: {},
        jsonResponse: { error: err.message || 'API Request Failed' },
      });
    } finally {
      setApiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Developer REST API Reference</h2>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Integrate PDF to PDF/A conversion directly into your backend workflow, microservices, or mobile apps.
              Send multipart form files or JSON payloads and receive standard ISO 19005 compliant PDF/A binary files or structured compliance data.
            </p>
          </div>
        </div>

        {/* Endpoint Badges */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 text-[11px] font-extrabold bg-blue-600 text-white rounded-md">POST</span>
              <code className="text-xs font-mono font-bold text-slate-800">/api/convert-pdfa</code>
            </div>
            <p className="text-xs text-slate-500 mt-1">Converts input PDF to PDF/A and returns binary file or JSON payload.</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 text-[11px] font-extrabold bg-blue-600 text-white rounded-md">POST</span>
              <code className="text-xs font-mono font-bold text-slate-800">/api/validate-pdfa</code>
            </div>
            <p className="text-xs text-slate-500 mt-1">Evaluates PDF for ISO 19005 compliance criteria without modifying content.</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Code Generator & Live Tester */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Code Snippet Generator */}
        <div className="lg:col-span-7 bg-slate-900 rounded-2xl border border-slate-800 shadow-lg text-slate-200 overflow-hidden flex flex-col">
          
          {/* Controls Bar */}
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
              {(['curl', 'js', 'python', 'node'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setActiveLang(lang)}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-colors ${
                    activeLang === lang
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lang === 'curl' ? 'cURL' : lang === 'js' ? 'JavaScript' : lang === 'python' ? 'Python' : 'Node.js'}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-3 text-xs">
              <label className="text-slate-400 font-medium">Return:</label>
              <select
                value={returnType}
                onChange={(e) => setReturnType(e.target.value as any)}
                className="bg-slate-900 text-slate-200 border border-slate-800 rounded-md px-2 py-1 text-xs focus:outline-hidden"
              >
                <option value="binary">Binary PDF File</option>
                <option value="json">JSON (Base64 + Report)</option>
              </select>

              <button
                onClick={handleCopy}
                className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors inline-flex items-center space-x-1 text-xs"
                title="Copy code"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Code Window */}
          <div className="p-4 font-mono text-xs text-blue-300 bg-slate-900 overflow-x-auto min-h-[280px]">
            <pre><code>{currentSnippet()}</code></pre>
          </div>
        </div>

        {/* Right: Live API Tester Console */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-indigo-600" />
              <span>Live API Tester</span>
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Interactive
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Title Parameter</label>
              <input
                type="text"
                value={testTitle}
                onChange={(e) => setTestTitle(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Author Parameter</label>
              <input
                type="text"
                value={testAuthor}
                onChange={(e) => setTestAuthor(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Upload PDF File (Optional)</label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setTestFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-600 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
              />
            </div>

            <button
              onClick={runLiveApiTest}
              disabled={apiLoading}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 active:scale-98 transition-all inline-flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{apiLoading ? 'Sending Request...' : 'Send Test API Request'}</span>
            </button>
          </div>

          {/* Result Output */}
          {apiResult && (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-emerald-600">HTTP {apiResult.status} OK</span>
                <span className="text-slate-400">{apiResult.timeMs} ms</span>
              </div>

              {apiResult.pdfBlobUrl && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div className="text-xs text-emerald-900 font-medium">
                    Returned binary PDF/A file!
                  </div>
                  <a
                    href={apiResult.pdfBlobUrl}
                    download="api-test-output.pdf"
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold inline-flex items-center space-x-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download PDF</span>
                  </a>
                </div>
              )}

              {apiResult.jsonResponse && (
                <div className="bg-slate-900 text-emerald-400 p-3 rounded-xl font-mono text-[11px] max-h-40 overflow-y-auto">
                  <pre>{JSON.stringify(apiResult.jsonResponse, null, 2)}</pre>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
