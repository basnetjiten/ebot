import { BaseMessage, BaseMessageLike } from "@langchain/core/messages";
import { Annotation, messagesStateReducer } from "@langchain/langgraph";
import { ReflectionEntry, MoodAnalysis, Goal, Todo, ReflectionAnalysis } from "../types";

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
  moodAnalysis: Annotation<MoodAnalysis | null>({
    reducer: (left: MoodAnalysis | null, right: MoodAnalysis | null) => right,
    default: () => null,
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

  // Goal tracking
  userGoals: Annotation<Goal[]>({
    reducer: (left: Goal[], right: Goal[]) => right,
    default: () => [],
  }),

  goalAlignment: Annotation<{
    aligned: boolean;
    suggestions: string[];
  }>({
    reducer: (left: { aligned: boolean; suggestions: string[] }, right: { aligned: boolean; suggestions: string[] }) => right,
    default: () => ({ aligned: false, suggestions: [] }),
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
