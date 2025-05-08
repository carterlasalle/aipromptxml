# Claude Prompt XML Helper

This is a simple HTML and JavaScript-based web tool designed to help you construct well-structured XML prompts for interacting with Anthropic's Claude AI models.

Following Claude's best practices for prompt engineering, using XML tags can significantly improve the clarity, accuracy, and parseability of your prompts and Claude's responses. This tool provides a user-friendly interface to dynamically build these XML structures.

## Features

*   **Dynamic Element Creation:** Easily add or remove XML elements for different parts of your prompt.
*   **Recommended Tags Sidebar:** Quickly add common and recommended Claude tags (e.g., `<instructions>`, `<context>`, `<document>`, `<example>`) with a single click.
*   **Custom Tag Names:** Flexibility to use any tag name you need, with autocomplete suggestions for common tags.
*   **CDATA Sections:** Automatically wraps element content in `<![CDATA[...]]>` sections.
    *   This ensures that any special characters (like `<`, `>`, `&`) or even nested XML-like structures within your content are treated as literal text and do not break the main XML prompt structure.
    *   Properly escapes `]]>` within CDATA content if it occurs.
*   **Optional Root Tag:** Define a main root tag for your entire prompt structure (e.g., `<prompt_structure>`) or generate a sequence of elements without one.
*   **Real-time XML Generation:** See the generated XML output instantly as you build your prompt.
*   **Copy to Clipboard:** Easily copy the generated XML.
*   **Download XML:** Download the prompt as an `.xml` file.
*   **Claude Prompting Tips:** Includes a handy reference section with best practices for using XML with Claude.
*   **Client-Side:** Runs entirely in your browser. No data is sent to any server.

## Why Use XML for Claude Prompts?

Anthropic recommends using XML tags to structure complex prompts because:

*   **Clarity:** Clearly demarcates different sections of your prompt (e.g., instructions, context, examples, user queries).
*   **Accuracy:** Helps Claude better understand the distinct roles of different pieces of information, reducing misinterpretations.
*   **Flexibility:** Makes it easier to add, remove, or modify parts of your prompt.
*   **Parseability:** If you instruct Claude to use XML tags in its output, it makes post-processing and extracting specific information from the response much simpler.

## How to Use

1.  **Open `index.html`:** Simply open the `index.html` file in any modern web browser.
2.  **(Optional) Set Root Tag:** If you want your entire prompt enclosed in a single parent tag, enter its name in the "Root Tag Name" field (defaults to `prompt_structure`). You can leave this blank.
3.  **Add Prompt Elements:**
    *   Click on a tag from the "Recommended Tags" sidebar (e.g., `<instructions>`). This will add a new element group with the tag name pre-filled.
    *   Or, click the "Add Custom Element" button to add a blank element group.
4.  **Define Elements:**
    *   For each element group:
        *   Enter a **Tag Name** (e.g., `context`, `document`, `user_query`). Use the datalist for suggestions.
        *   Enter the **Content** for that tag in the textarea. You can use newlines and special characters. If you need to include pre-formatted XML or code snippets as content, simply paste them in; the CDATA section will protect them.
5.  **Generate XML:** Click the "Generate Prompt XML" button.
6.  **Review Output:** The generated XML will appear in the text area at the bottom.
7.  **Copy or Download:**
    *   Click "Copy XML" to copy it to your clipboard.
    *   Click "Download XML" to save it as an `.xml` file.

## Example Workflow

Let's say you want to create a prompt for Claude to summarize a document:

1.  **Root Tag:** You might leave this as `prompt_structure` or clear it.
2.  **Add Elements:**
    *   Click `<instructions>` from the sidebar.
        *   **Content:** `Please summarize the following document. Focus on the key findings and recommendations. Keep the summary concise, under 200 words.`
    *   Click `<document>` from the sidebar.
        *   **Content:** `(Paste your lengthy document text here...)`
3.  **Generate XML:** Click "Generate Prompt XML".
4.  **Output:** You'll see something like:

    ```xml
    <prompt_structure>
      <instructions>
        <![CDATA[
    Please summarize the following document. Focus on the key findings and recommendations. Keep the summary concise, under 200 words.
        ]]>
      </instructions>
      <document>
        <![CDATA[
    (Paste your lengthy document text here...)
        ]]>
      </document>
    </prompt_structure>
    ```

5.  Copy this XML and use it as your prompt for Claude.

## File Structure

*   `index.html`: The main HTML file containing the structure, styling (CSS within `<style>` tags), and JavaScript logic (within `<script>` tags).

## Development

This tool is a single HTML file. To modify it:

1.  Open `index.html` in a text editor.
2.  The HTML structure defines the layout.
3.  CSS rules are within the `<style>` tags in the `<head>`.
4.  All JavaScript functionality is within the `<script>` tags at the end of the `<body>`.

## Contributions

Feel free to fork this repository, make improvements, and suggest changes or open pull requests!

## License

This tool is open-source and available under the MIT License. See the `LICENSE` file for more details (though no separate LICENSE file is included in this single-file tool context, the intent is MIT).
