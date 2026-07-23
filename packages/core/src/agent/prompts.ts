import { fillAgentPlaceholders } from "../agentConfig.js";

export type AgentPromptTemplates = {
  system: string;
  user: string;
  final: string;
};

export function buildSystemPrompt(
  language: string,
  maxArchitectureNodes: number,
  systemTemplate: string,
): string {
  return fillAgentPlaceholders(systemTemplate, {
    language,
    max_architecture_nodes: String(maxArchitectureNodes),
  });
}

export function buildUserPrompt(
  input: {
    owner: string;
    repo: string;
    ref?: string;
    template: string;
  },
  userTemplate: string,
): string {
  const refLine = input.ref ? `ref: ${input.ref}` : "ref: (default branch)";
  return fillAgentPlaceholders(userTemplate, {
    owner: input.owner,
    repo: input.repo,
    ref_line: refLine,
    template: input.template,
  });
}

export function buildFinalInstruction(finalTemplate: string): string {
  return finalTemplate.trim();
}
