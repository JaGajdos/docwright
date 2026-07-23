Generate onboarding docs for GitHub repo {{owner}}/{{repo}} ({{ref_line}}).

Fill this README template (keep the same section structure; translate headings and all prose into the requested output language):

----- TEMPLATE START -----
{{template}}
----- TEMPLATE END -----

Put the Mermaid diagram into {{architecture_map}} as a fenced mermaid block inside readmeMarkdown, and also return raw mermaid in architectureMermaid.
architectureMarkdownFile should be a short markdown file containing the diagram (same output language as the README).
