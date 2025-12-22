import type { JaimeSession } from "@/types/jaime";

/**
 * Export session to Markdown format
 */
export function exportToMarkdown(session: JaimeSession): string {
  const startTime = new Date(session.startTime);
  const endTime = session.endTime ? new Date(session.endTime) : null;

  // Calculate duration
  const duration = endTime
    ? Math.round((endTime.getTime() - startTime.getTime()) / 1000 / 60)
    : 0;

  let markdown = `# Jaime Session - ${startTime.toLocaleString()}\n\n`;
  markdown += `**Duration:** ${duration} minutes\n`;
  markdown += `**Mode:** ${session.privacyMode}\n`;
  markdown += `**Sensitivity:** ${session.sensitivity}\n`;
  markdown += `**Lines:** ${session.transcriptLines.length}\n\n`;
  markdown += `---\n\n`;

  // Topics section
  if (session.topicGroups && session.topicGroups.length > 0) {
    markdown += `## Topics\n\n`;

    for (const topic of session.topicGroups) {
      markdown += `### ${topic.title}\n\n`;

      // Transcript excerpt for this topic
      const topicLines = session.transcriptLines.slice(
        topic.startLineIndex,
        topic.endLineIndex + 1
      );

      for (const line of topicLines) {
        const timestamp = new Date(line.timestamp);
        const timeStr = timestamp.toLocaleTimeString();
        markdown += `[${timeStr}] ${line.text}\n\n`;
      }

      // URLs associated with this topic
      if (topic.urls.length > 0) {
        markdown += `**URLs:**\n`;
        for (const url of topic.urls) {
          const urlData = session.urlHistory.find((u) => u.url === url);
          const relevance = urlData?.relevance ?? 'N/A';
          markdown += `- ${url} - ${relevance}\n`;
        }
        markdown += `\n`;
      }

      // Keywords
      if (topic.keywords.length > 0) {
        markdown += `**Keywords:** ${topic.keywords.join(', ')}\n\n`;
      }

      markdown += `---\n\n`;
    }
  }

  // Full transcript section
  markdown += `## Full Transcript\n\n`;
  for (const line of session.transcriptLines) {
    const timestamp = new Date(line.timestamp);
    const hours = timestamp.getHours().toString().padStart(2, '0');
    const minutes = timestamp.getMinutes().toString().padStart(2, '0');
    const seconds = timestamp.getSeconds().toString().padStart(2, '0');
    markdown += `[${hours}:${minutes}:${seconds}] ${line.text}\n\n`;
  }

  return markdown;
}

/**
 * Export session to JSON format
 */
export function exportToJSON(session: JaimeSession): string {
  return JSON.stringify(session, null, 2);
}

/**
 * Download file to user's computer
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
