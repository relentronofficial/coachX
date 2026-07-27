/**
 * Topic options for the "Which topics could you talk about for hours?" question.
 *
 * The full enterprise topic system now lives in `topicLibrary.ts` (raw taxonomy)
 * and `topicEngine.ts` (enrichment, indexes, search, recommendations). This
 * module re-exports the engine-derived scoring options so the assessment engine
 * and question bank keep working unchanged.
 */

export { topicOptions, TOPIC_COUNT as topicCount, GROUPS as TOPIC_GROUP_NAMES } from './topicEngine';
