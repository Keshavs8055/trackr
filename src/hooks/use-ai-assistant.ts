"use client";

import { useState, useCallback } from 'react';
import { aiService } from '@/services/ai-service';
import { Resource, NLQueryResult, AIDuplicateGroup, AIMetadataCleanupResult, Collection } from '@/types';
import { AppError } from '@/lib/app-error';

export function useAIAssistant() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const userId = 'mock-user-id'; // Single-user local workspace default

  const clearState = useCallback(() => {
    setIsAnalyzing(false);
    setStreamingText('');
    setError(null);
  }, []);

  const generateAutoTags = useCallback(
    async (resource: Resource, existingTags: string[] = []): Promise<string[]> => {
      setIsAnalyzing(true);
      setError(null);
      try {
        const tags = await aiService.generateAutoTags(userId, resource, existingTags);
        return tags;
      } catch (err: any) {
        const msg = err?.message || 'Failed to generate auto-tags.';
        setError(msg);
        throw err;
      } finally {
        setIsAnalyzing(false);
      }
    },
    [userId]
  );


  const findSimilarResources = useCallback(
    async (target: Resource, allResources: Resource[]) => {
      setIsAnalyzing(true);
      setError(null);
      try {
        return await aiService.findSimilarResources(userId, target, allResources);
      } catch (err: any) {
        setError(err?.message || 'Failed to find similar resources.');
        return [];
      } finally {
        setIsAnalyzing(false);
      }
    },
    [userId]
  );

  const naturalLanguageQuery = useCallback(
    async (query: string, allResources: Resource[]): Promise<NLQueryResult | null> => {
      setIsAnalyzing(true);
      setError(null);
      try {
        return await aiService.naturalLanguageQuery(userId, query, allResources);
      } catch (err: any) {
        setError(err?.message || 'Failed to process natural language query.');
        return null;
      } finally {
        setIsAnalyzing(false);
      }
    },
    [userId]
  );

  const generateSmartCollection = useCallback(
    async (prompt: string, availableResources: Resource[]): Promise<Partial<Collection> | null> => {
      setIsAnalyzing(true);
      setError(null);
      try {
        return await aiService.generateSmartCollection(userId, prompt, availableResources);
      } catch (err: any) {
        setError(err?.message || 'Failed to generate smart collection.');
        return null;
      } finally {
        setIsAnalyzing(false);
      }
    },
    [userId]
  );

  const detectDuplicates = useCallback(
    async (allResources: Resource[]): Promise<AIDuplicateGroup[]> => {
      setIsAnalyzing(true);
      setError(null);
      try {
        return await aiService.detectDuplicates(userId, allResources);
      } catch (err: any) {
        setError(err?.message || 'Failed to detect duplicates.');
        return [];
      } finally {
        setIsAnalyzing(false);
      }
    },
    [userId]
  );

  const cleanMetadata = useCallback(
    async (resource: Resource): Promise<AIMetadataCleanupResult | null> => {
      setIsAnalyzing(true);
      setError(null);
      try {
        return await aiService.cleanMetadata(userId, resource);
      } catch (err: any) {
        setError(err?.message || 'Failed to clean metadata.');
        return null;
      } finally {
        setIsAnalyzing(false);
      }
    },
    [userId]
  );

  return {
    isAnalyzing,
    streamingText,
    error,
    clearState,
    generateAutoTags,
    findSimilarResources,
    naturalLanguageQuery,
    generateSmartCollection,
    detectDuplicates,
    cleanMetadata,
  };
}
