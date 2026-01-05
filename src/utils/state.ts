import { BaseMessage, BaseMessageLike } from "@langchain/core/messages";
import { Annotation, messagesStateReducer } from "@langchain/langgraph";
import { ReflectionEntry, Todo } from "../types";

export const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[], BaseMessageLike[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),

  // User context
  userId: Annotation<string>({
    reducer: (left: string, right: string) => right,
    default: () => "",
  }),

  // Reflection data
  currentReflection: Annotation<ReflectionEntry | null>({
    reducer: (left: ReflectionEntry | null, right: ReflectionEntry | null) => right,
    default: () => null,
  }),

  // Analysis results
  keywordAnalysis: Annotation<string[] | null>({
    reducer: (left: string[] | null, right: string[] | null) => right,
    default: () => [],
  }),

  summary: Annotation<string>({
    reducer: (left: string, right: string) => right,
    default: () => "",
  }),

  feedback: Annotation<string>({
    reducer: (left: string, right: string) => right,
    default: () => "",
  }),

  // Todo management
  suggestedTodos: Annotation<Todo[]>({
    reducer: (left: Todo[], right: Todo[]) => right,
    default: () => [],
  }),

  createdTodos: Annotation<Todo[]>({
    reducer: (left: Todo[], right: Todo[]) => right,
    default: () => [],
  }),

  // Web search integration
  needsWebSearch: Annotation<boolean>({
    reducer: (left: boolean, right: boolean) => right,
    default: () => false,
  }),

  query: Annotation<string>({
    reducer: (left: string, right: string) => right,
    default: () => "",
  }),

  searchResults: Annotation<string>({
    reducer: (left: string, right: string) => right,
    default: () => "",
  }),

  // Processing state
  currentStep: Annotation<string>({
    reducer: (left: string, right: string) => right,
    default: () => "initial",
  }),

  // Analysis complete flag
  analysisComplete: Annotation<boolean>({
    reducer: (left: boolean, right: boolean) => right,
    default: () => false,
  }),

  // Error handling
  error: Annotation<string | null>({
    reducer: (left: string | null, right: string | null) => right,
    default: () => null,
  }),
});

export type AgentStateType = typeof StateAnnotation.State;
