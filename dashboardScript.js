window.addEventListener('load', () => {
	const params = new URLSearchParams(window.location.search);

	  if (params.get('upload') === 'success') {
	    alert("✅ File uploaded successfully!");

	    // Remove the ?upload=success from the URL
	    history.replaceState(null, '', location.pathname);
	  }

	  if (params.get('upload') === 'fail') {
	    alert("❌ File upload failed. Please try again.");

	    // Remove the ?upload=fail from the URL
	    history.replaceState(null, '', location.pathname);
	  }

  fetch('api/files')
    .then(res => {
      if (!res.ok) {
		console.log(res);
       location.href = 'login.html';
       return;
      }
      return res.json();
    })
    .then(data => {
      const table = document.getElementById('fileTable').querySelector('tbody');
      const now = new Date();

      data.forEach(file => {
        const row = document.createElement('tr');
        const link = `${location.origin}/linklock/download?uuid=${file.uuid}`;

        const uploadTime = new Date(file.uploadTime);
        const expiryTime = new Date(uploadTime.getTime() + file.expiryMinutes * 60000);

        const isExpired = now > expiryTime;
        const isLimitReached = file.downloadCount >= file.maxDownloads;
        const isInactive = isExpired || isLimitReached;

        row.style.textDecoration = isInactive ? 'line-through' : 'none';

        row.innerHTML = `
          <td>${file.originalName}</td>
          <td>${Math.round(file.size / 1024)} KB</td>
          <td>${file.expiryMinutes} min</td>
          <td>${file.downloadCount} / ${file.maxDownloads}</td>
          <td><input type="text" value="${link}" readonly></td>
          <td>
            <button class="copy-btn" onclick="copyLink(this)" ${isInactive ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>Copy</button>
            <form method="post" action="delete" style="display:inline;">
              <input type="hidden" name="uuid" value="${file.uuid}">
              <button class="delete-btn">Delete</button>
            </form>
            <button class="action-btn" onclick="viewLogs('${file.uuid}')">View Logs</button>
          </td>
        `;
        table.appendChild(row);
      });
    });
});

function copyLink(btn) {
  const input = btn.parentElement.parentElement.querySelector("input");
  input.select();
  document.execCommand("copy");
  alert("📋 Link copied!");
}

function viewLogs(uuid) {
  fetch(`/linklock/api/downloads?uuid=${uuid}`)
    .then(res => res.json())
    .then(logs => {
      const overlay = document.getElementById("logsOverlay");
      const content = document.getElementById("logsContent");

      if (logs.length === 0) {
        content.innerHTML = "<p>No download logs available.</p>";
      } else {
        let html = "<ul>";
        logs.forEach(log => {
          const date = new Date(log.downloadedAt).toLocaleString();
          html += `<li><strong>${log.ipAddress}</strong> at <em>${date}</em></li>`;
        });
        html += "</ul>";
        content.innerHTML = html;
      }

      overlay.style.display = "flex";
    });
}

function closeLogs() {
  document.getElementById("logsOverlay").style.display = "none";
}
