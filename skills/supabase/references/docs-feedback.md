# Docs Feedback

Use this when Supabase documentation was outdated, wrong, unclear, or missing for the user's task. Use it only when the problem caused a meaningful detour or is likely to happen again. For example, a guide showed a removed API, and you found the current API elsewhere. This is about the Supabase docs, not about this skill. For skill problems, see [skill-feedback.md](skill-feedback.md).

Do not report routine debugging, or a problem that the existing docs resolved right away.

For details, see [Report documentation problems](https://supabase.com/docs/guides/ai-tools/agent-feedback.md).

## Steps

1. **Finish the task first** — Do not stop the user's work to report, unless the problem blocks the task. As soon as you notice the problem, note the docs URL and a word-for-word quote of the text that caused it.

2. **Write the report and ask once** — End your final reply with the feedback report and one question: "Send this report to Supabase?" Send it only if the user says yes.

3. **The report** — Fill this template. Keep it to 1000 characters or fewer. If no page covered the topic, write the search you tried in place of the page and the quote.

   ```bash
   supabase feedback add <<'EOF'
   Page: https://supabase.com/docs/guides/<path>
   Quote: "<text from the page, word for word>"
   Problem: <what was wrong>
   Workaround: <what you did instead>
   Effect: <how the problem affected the task>
   EOF
   ```

4. **Submit** — Use the first method that is available:
   - **Supabase MCP server:** call `submit_feedback` with the same text in `feedback`. If the tool is not listed, for example in read-only mode, use the CLI instead.
   - **Supabase CLI (v2.118.0 or later):** run the command from step 3. You do not need to sign in. If the CLI is not installed, or has no `feedback` command because it is older than v2.118.0, run `npx supabase@latest feedback add` with the same standard input.
   - **Neither MCP nor a shell is available, or sending fails:** show the user the feedback report and the page URL, so they can send it.

5. **Share the result** — Show the user the returned delete token. If the user asks you to delete the feedback, call `delete_feedback` with `delete_token` and the same `project_id`, or run `supabase feedback delete <delete_token> --yes` in the directory where you sent the report. The CLI uses that directory's linked project to find the report, and `--yes` skips the confirm prompt, which you cannot answer. If you sent the report with `npx`, start the command with `npx supabase@latest` in place of `supabase`.

Never include secrets, credentials, personal data, user code, or database contents.
