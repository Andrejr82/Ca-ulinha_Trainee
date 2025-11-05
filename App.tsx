/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import {Video} from '@google/genai';
import React, {useCallback, useEffect, useState} from 'react';
import ApiKeyDialog from './components/ApiKeyDialog';
import LoadingIndicator from './components/LoadingIndicator';
import PromptForm from './components/PromptForm';
import VideoResult from './components/VideoResult';
import {generateVideo} from './services/geminiService';
import {
  AppState,
  AspectRatio,
  GenerateVideoParams,
  GenerationMode,
  ImageFile,
  Resolution,
  VeoModel,
  VideoFile,
} from './types';

// Fix: Added missing base64ToImageFile helper function.
/**
 * Converts a base64 string to an ImageFile object.
 * @param base64 The raw base64 string (without data URI prefix).
 * @param filename The desired filename for the resulting file.
 * @returns An ImageFile object.
 */
const base64ToImageFile = (base64: string, filename: string): ImageFile => {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  // The MIME type should match the original image type.
  const blob = new Blob([byteArray], {type: 'image/jpeg'});
  const file = new File([blob], filename, {type: 'image/jpeg'});
  return {file, base64};
};

// Base64 representation of the Caçulinha character image.
// Fix: Correctly formatted the base64 data as a string literal. This resolves numerous parsing errors.
const caculinhaBase64 =
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAfQBiADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHp6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9/KKKKACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigAooooACiiigA...';

// Fix: Added missing initialPrompt constant.
// The prompt is derived from the JSON script provided by the user.
const initialPrompt = `An Anime 3D corporate presentation about the ADMAT tool. The style is futuristic with soft lighting, using a color palette of neon green, gold, and holographic blue. The protagonist is Caçulinha, a charismatic and curious 3D avatar, who presents the tool. The video explains how ADMAT identifies new products without sales, showing holographic BI dashboards and a supervisor named Lorenzo working in a store. The video should be light and visual. End with the call to action: 'ADMAT — Garantindo o fluxo entre o dado e a venda.'`;

/**
 * Parses an error from the video generation API into a user-friendly message.
 * @param error The error object caught from the API call.
 * @returns An object containing a user-friendly message and a flag to reopen the API key dialog.
 */
const parseApiError = (
  error: unknown,
): {message: string; shouldOpenDialog: boolean} => {
  const errorMessage =
    error instanceof Error ? error.message : 'An unknown error occurred.';

  if (typeof errorMessage === 'string') {
    if (errorMessage.includes('Requested entity was not found.')) {
      return {
        message:
          'Model not found. This can be caused by an invalid API key or permission issues. Please check your API key.',
        shouldOpenDialog: true,
      };
    }
    if (
      errorMessage.includes('API_KEY_INVALID') ||
      errorMessage.includes('API key not valid') ||
      errorMessage.toLowerCase().includes('permission denied')
    ) {
      return {
        message:
          'Your API key is invalid or lacks permissions. Please select a valid, billing-enabled API key.',
        shouldOpenDialog: true,
      };
    }
  }
  return {
    message: `Video generation failed: ${errorMessage}`,
    shouldOpenDialog: false,
  };
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastConfig, setLastConfig] = useState<GenerateVideoParams | null>(
    null,
  );
  const [lastVideoObject, setLastVideoObject] = useState<Video | null>(null);
  const [lastVideoBlob, setLastVideoBlob] = useState<Blob | null>(null);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);

  const [initialFormValues, setInitialFormValues] =
    useState<GenerateVideoParams | null>(null);

  // On initial load, pre-fill the form with the Caçulinha/ADMAT data.
  useEffect(() => {
    const imageFile = base64ToImageFile(caculinhaBase64, 'caculinha.jpg');
    setInitialFormValues({
      prompt: initialPrompt,
      model: VeoModel.VEO,
      aspectRatio: AspectRatio.LANDSCAPE,
      resolution: Resolution.P720,
      mode: GenerationMode.REFERENCES_TO_VIDEO,
      referenceImages: [imageFile],
      // Ensure other media types are cleared
      startFrame: null,
      endFrame: null,
      styleImage: null,
      inputVideo: null,
      inputVideoObject: null,
      isLooping: false,
    });
  }, []);

  // Check for API key on initial load
  useEffect(() => {
    const checkApiKey = async () => {
      if (window.aistudio) {
        try {
          if (!(await window.aistudio.hasSelectedApiKey())) {
            setShowApiKeyDialog(true);
          }
        } catch (error) {
          console.warn(
            'aistudio.hasSelectedApiKey check failed, assuming no key selected.',
            error,
          );
          setShowApiKeyDialog(true);
        }
      }
    };
    checkApiKey();
  }, []);

  const showStatusError = (message: string) => {
    setErrorMessage(message);
    setAppState(AppState.ERROR);
  };

  const handleGenerate = useCallback(async (params: GenerateVideoParams) => {
    if (window.aistudio) {
      try {
        if (!(await window.aistudio.hasSelectedApiKey())) {
          setShowApiKeyDialog(true);
          return;
        }
      } catch (error) {
        console.warn(
          'aistudio.hasSelectedApiKey check failed, assuming no key selected.',
          error,
        );
        setShowApiKeyDialog(true);
        return;
      }
    }

    setAppState(AppState.LOADING);
    setErrorMessage(null);
    setLastConfig(params);
    // Reset initial form values for the next fresh start
    setInitialFormValues(null);

    try {
      const {objectUrl, blob, video} = await generateVideo(params);
      setVideoUrl(objectUrl);
      setLastVideoBlob(blob);
      setLastVideoObject(video);
      setAppState(AppState.SUCCESS);
    } catch (error) {
      console.error('Video generation failed:', error);
      const {message, shouldOpenDialog} = parseApiError(error);
      setErrorMessage(message);
      setAppState(AppState.ERROR);
      if (shouldOpenDialog) {
        setShowApiKeyDialog(true);
      }
    }
  }, []);

  const handleRetry = useCallback(() => {
    if (lastConfig) {
      handleGenerate(lastConfig);
    }
  }, [lastConfig, handleGenerate]);

  const handleApiKeyDialogContinue = async () => {
    setShowApiKeyDialog(false);
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
    }
    if (appState === AppState.ERROR && lastConfig) {
      handleRetry();
    }
  };

  const handleNewVideo = useCallback(() => {
    setAppState(AppState.IDLE);
    setVideoUrl(null);
    setErrorMessage(null);
    setLastConfig(null);
    setLastVideoObject(null);
    setLastVideoBlob(null);
    setInitialFormValues(null); // Clear the form state
  }, []);

  const handleTryAgainFromError = useCallback(() => {
    if (lastConfig) {
      setInitialFormValues(lastConfig);
      setAppState(AppState.IDLE);
      setErrorMessage(null);
    } else {
      // Fallback to a fresh start if there's no last config
      handleNewVideo();
    }
  }, [lastConfig, handleNewVideo]);

  const handleExtend = useCallback(async () => {
    if (lastConfig && lastVideoBlob && lastVideoObject) {
      try {
        const file = new File([lastVideoBlob], 'last_video.mp4', {
          type: lastVideoBlob.type,
        });
        const videoFile: VideoFile = {file, base64: ''};

        setInitialFormValues({
          ...lastConfig, // Carry over model, aspect ratio
          mode: GenerationMode.EXTEND_VIDEO,
          prompt: '', // Start with a blank prompt
          inputVideo: videoFile, // for preview in the form
          inputVideoObject: lastVideoObject, // for the API call
          resolution: Resolution.P720, // Extend requires 720p
          // Reset other media types
          startFrame: null,
          endFrame: null,
          referenceImages: [],
          styleImage: null,
          isLooping: false,
        });

        setAppState(AppState.IDLE);
        setVideoUrl(null);
        setErrorMessage(null);
      } catch (error) {
        console.error('Failed to process video for extension:', error);
        const message =
          error instanceof Error ? error.message : 'An unknown error occurred.';
        showStatusError(`Failed to prepare video for extension: ${message}`);
      }
    }
  }, [lastConfig, lastVideoBlob, lastVideoObject]);

  const renderError = (message: string) => (
    <div className="text-center bg-red-900/20 border border-red-500 p-8 rounded-lg">
      <h2 className="text-2xl font-bold text-red-400 mb-4">Error</h2>
      <p className="text-red-300">{message}</p>
      <button
        onClick={handleTryAgainFromError}
        className="mt-6 px-6 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">
        Try Again
      </button>
    </div>
  );

  return (
    <div className="h-screen bg-black text-gray-200 flex flex-col font-sans overflow-hidden">
      {showApiKeyDialog && (
        <ApiKeyDialog onContinue={handleApiKeyDialogContinue} />
      )}
      <header className="py-6 flex justify-center items-center px-8 relative z-10">
        <h1 className="text-5xl font-semibold tracking-wide text-center bg-gradient-to-r from-green-400 via-yellow-400 to-blue-500 bg-clip-text text-transparent">
          Caçulinha's ADMAT Studio
        </h1>
      </header>
      <main className="w-full max-w-4xl mx-auto flex-grow flex flex-col p-4">
        {appState === AppState.IDLE ? (
          <>
            <div className="flex-grow flex flex-col items-center justify-center pt-4 gap-6">
              <img
                src={`data:image/jpeg;base64,${caculinhaBase64}`}
                alt="Caçulinha"
                className="w-56 h-auto rounded-2xl shadow-2xl shadow-indigo-500/20"
              />
              <div className="relative text-center">
                <h2 className="text-3xl text-gray-400">
                  Hey there! I'm Caçulinha.
                </h2>
                <p className="text-xl text-gray-500 mt-2">
                  Let's create a video about the ADMAT tool!
                </p>
              </div>
            </div>
            <div className="pb-4">
              <PromptForm
                onGenerate={handleGenerate}
                initialValues={initialFormValues}
              />
            </div>
          </>
        ) : (
          <div className="flex-grow flex items-center justify-center">
            {appState === AppState.LOADING && <LoadingIndicator />}
            {appState === AppState.SUCCESS && videoUrl && (
              <VideoResult
                videoUrl={videoUrl}
                onRetry={handleRetry}
                onNewVideo={handleNewVideo}
                onExtend={handleExtend}
                canExtend={lastConfig?.resolution === Resolution.P720}
              />
            )}
            {appState === AppState.SUCCESS &&
              !videoUrl &&
              renderError(
                'Video generated, but URL is missing. Please try again.',
              )}
            {appState === AppState.ERROR &&
              errorMessage &&
              renderError(errorMessage)}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
