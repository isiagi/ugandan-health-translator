"use client";

import { useState } from "react";
import {
  Volume2,
  Loader2,
  Languages,
  Heart,
  AlertCircle,
  VolumeX,
  ChevronDown,
} from "lucide-react";

const languages = [
  { code: "ach", name: "Acholi", nativeName: "Acholi" },
  { code: "teo", name: "Ateso", nativeName: "Ateso" },
  { code: "lug", name: "Luganda", nativeName: "Oluganda" },
  { code: "lgg", name: "Lugbara", nativeName: "Lugbara" },
  { code: "nyn", name: "Runyankole", nativeName: "Runyankole" },
];

const healthTopics: any = {
  malaria: {
    title: "Malaria Prevention & Treatment",
    content: `Malaria is a serious disease spread by mosquito bites. Symptoms include fever, chills, headache, and body aches. To prevent malaria: sleep under treated mosquito nets, use insect repellent, wear long sleeves and pants in the evening, and remove standing water around your home. If you have fever, seek medical care immediately. Take antimalarial medication as prescribed by a healthcare worker. Pregnant women and children under 5 are at highest risk and should take extra precautions.`,
  },
  covid19: {
    title: "COVID-19 Prevention & Safety",
    content: `COVID-19 is a respiratory illness that spreads through droplets when infected people cough, sneeze, or talk. Symptoms include fever, cough, difficulty breathing, loss of taste or smell, and fatigue. To protect yourself: wash hands frequently with soap for 20 seconds, wear a mask in crowded places, maintain physical distance from others, avoid touching your face, and get vaccinated when available. If you feel sick, stay home and seek medical advice. Cover coughs and sneezes with your elbow.`,
  },
  maternal: {
    title: "Maternal & Child Health Care",
    content: `Pregnant women should attend regular antenatal care visits to monitor the health of mother and baby. Eat nutritious foods including fruits, vegetables, and proteins. Take folic acid and iron supplements as recommended. Avoid alcohol, smoking, and harmful substances. Deliver with a skilled birth attendant at a health facility. After birth, breastfeed exclusively for 6 months. Ensure children receive all recommended vaccinations. Watch for danger signs like severe bleeding, high fever, or difficulty breathing and seek immediate medical care.`,
  },
  hygiene: {
    title: "Personal & Community Hygiene",
    content: `Good hygiene prevents many diseases. Wash hands with soap and clean water before eating, after using the toilet, and after handling animals. Brush teeth twice daily and visit a dentist regularly. Keep your home and surroundings clean. Use clean, safe water for drinking and cooking. Store food properly to prevent contamination. Dispose of waste in designated areas. Keep latrines clean and away from water sources. Bathe regularly and wear clean clothes. Teach children proper hygiene habits from an early age.`,
  },
  nutrition: {
    title: "Nutrition & Healthy Eating",
    content: `A balanced diet is essential for good health. Eat a variety of foods including fruits, vegetables, whole grains, proteins, and dairy products. Limit sugar, salt, and processed foods. Drink plenty of clean water daily. For children, breastfeed exclusively for the first 6 months, then introduce nutritious complementary foods. Ensure children get enough vitamins and minerals for proper growth. Adults should maintain a healthy weight through proper diet and exercise. If you have diabetes or other conditions, follow dietary advice from healthcare providers.`,
  },
};

export default function HealthTranslator() {
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState("");
  const [currentAudio, setCurrentAudio] = useState(null);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showTopicDropdown, setShowTopicDropdown] = useState(false);

  const translateHealthInfo = async () => {
    if (!selectedLanguage || !selectedTopic) {
      setError("Please select both a language and a health topic");
      return;
    }

    setIsTranslating(true);
    setError("");
    setTranslatedText("");

    const topicData = healthTopics[selectedTopic];
    const englishText = topicData.content;

    try {
      // For demo purposes - in a real app, you'd use environment variables
      const authToken = process.env.NEXT_PUBLIC_SUNBIRD_AUTH_TOKEN;

      if (!authToken || authToken === "your-sunbird-api-token-here") {
        // Demo mode - show mock translation
        const languageName = languages.find(
          (l) => l.code === selectedLanguage
        )?.name;
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate API delay
        setTranslatedText(
          `[Demo Translation to ${languageName}]\n\n${englishText}\n\n[This is a demonstration. In production, this text would be translated to ${languageName} using the Sunbird Translate API. To enable real translation, configure your API token.]`
        );
        return;
      }

      // Real API call (when token is configured)
      const response = await fetch(
        "https://api.sunbird.ai/tasks/nllb_translate",
        {
          method: "POST",
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            source_language: "eng",
            target_language: selectedLanguage,
            text: englishText,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Translation API error (${response.status}): ${
            errorData.message || response.statusText
          }`
        );
      }

      const data = await response.json();
      const translation =
        data.output?.translated_text ||
        data.text ||
        data.translation ||
        data.result;

      if (!translation) {
        throw new Error("No translation received from API");
      }

      setTranslatedText(translation);
    } catch (err) {
      console.error("Translation error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";

      if (errorMessage.includes("401") || errorMessage.includes("403")) {
        setError("Authentication failed. Please check the API credentials.");
      } else if (errorMessage.includes("429")) {
        setError("Too many requests. Please wait a moment and try again.");
      } else {
        setError(
          "Translation failed. Please check your internet connection and try again."
        );
      }

      // Fallback for demo purposes
      const languageName = languages.find(
        (l) => l.code === selectedLanguage
      )?.name;
      setTranslatedText(
        `[Demo Translation to ${languageName}]\n\n${englishText}\n\n[This is a demo. In a real scenario, this text would be translated to ${languageName} using the Sunbird Translate API.]`
      );
    } finally {
      setIsTranslating(false);
    }
  };

  const generateAndPlayAudio = async () => {
    if (!translatedText) {
      setError("No text to convert to speech");
      return;
    }

    // For demo purposes - in a real app, you'd use environment variables
    const elevenLabsApiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;

    if (
      !elevenLabsApiKey ||
      elevenLabsApiKey === "your-elevenlabs-api-key-here"
    ) {
      setError(
        "ElevenLabs API key not configured. This is a demo - in production, configure your API key to enable text-to-speech."
      );
      return;
    }

    setIsGeneratingAudio(true);
    setError("");

    try {
      // Stop any currently playing audio
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        setIsPlaying(false);
      }

      // Voice selection based on language
      const getVoiceId = () => {
        switch (selectedLanguage) {
          case "lug":
            return "pNInz6obpgDQGcFmaJgB"; // Adam
          case "nyn":
            return "EXAVITQu4vr4xnSDxMaL"; // Bella
          case "ach":
            return "VR6AewLTigWG4xSOukaG"; // Antoni
          case "teo":
            return "pFZP5JQG7iQjIQuC4Bku"; // Lily
          case "lgg":
            return "onwK4e9ZLuTAKqWW03F9"; // Daniel
          default:
            return "pNInz6obpgDQGcFmaJgB";
        }
      };

      const voiceId = getVoiceId();

      // Direct API call to ElevenLabs (browser-compatible)
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: "POST",
          headers: {
            Accept: "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": elevenLabsApiKey,
          },
          body: JSON.stringify({
            text: translatedText,
            model_id: "eleven_multilingual_v2",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
              style: 0.0,
              use_speaker_boost: true,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `ElevenLabs API error (${response.status}): ${errorText}`
        );
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);
      setCurrentAudio(audio);

      audio.onloadstart = () => setIsPlaying(true);
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
      audio.onerror = () => {
        setIsPlaying(false);
        setError("Failed to play audio. Please try again.");
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
    } catch (err) {
      console.error("Audio generation error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";

      if (
        errorMessage.includes("401") ||
        errorMessage.includes("Unauthorized")
      ) {
        setError("Invalid ElevenLabs API key. Please check your credentials.");
      } else if (errorMessage.includes("429")) {
        setError("Too many requests. Please wait and try again.");
      } else if (
        errorMessage.includes("quota") ||
        errorMessage.includes("limit")
      ) {
        setError("ElevenLabs quota exceeded. Please try again later.");
      } else {
        setError("Failed to generate audio. Please try again.");
      }
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const stopAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const clearError = () => setError("");

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-teal-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4 py-6">
          <div className="flex items-center justify-center gap-3">
            <Heart className="h-10 w-10 text-red-500" />
            <Languages className="h-10 w-10 text-blue-600" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight">
            Uganda Health Guide
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Access important health information in your local language with
            high-quality voice narration
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-xl border-0">
          <div className="bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-t-xl p-6">
            <h2 className="text-xl md:text-2xl flex items-center gap-3 font-bold">
              <Languages className="h-7 w-7" />
              Get Health Information
            </h2>
          </div>
          <div className="p-6 md:p-8 space-y-8">
            {/* Language Selection */}
            <div className="space-y-4">
              <label className="text-lg md:text-xl font-semibold text-gray-800 block">
                1. Select Your Language
              </label>
              <div className="relative">
                <button
                  onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                  className="w-full h-16 px-4 text-lg md:text-xl border-2 border-gray-300 rounded-lg bg-white text-left flex items-center justify-between focus:border-blue-500 focus:outline-none"
                >
                  {selectedLanguage ? (
                    <div className="flex flex-col">
                      <span className="font-semibold">
                        {
                          languages.find((l) => l.code === selectedLanguage)
                            ?.name
                        }
                      </span>
                      <span className="text-sm text-gray-600">
                        {
                          languages.find((l) => l.code === selectedLanguage)
                            ?.nativeName
                        }
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-500">
                      Choose your preferred language
                    </span>
                  )}
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                </button>
                {showLanguageDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setSelectedLanguage(lang.code);
                          setShowLanguageDropdown(false);
                        }}
                        className="w-full px-4 py-4 text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex flex-col">
                          <span className="font-semibold text-lg">
                            {lang.name}
                          </span>
                          <span className="text-sm text-gray-600">
                            {lang.nativeName}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Health Topic Selection */}
            <div className="space-y-4">
              <label className="text-lg md:text-xl font-semibold text-gray-800 block">
                2. Choose Health Topic
              </label>
              <div className="relative">
                <button
                  onClick={() => setShowTopicDropdown(!showTopicDropdown)}
                  className="w-full h-16 px-4 text-lg md:text-xl border-2 border-gray-300 rounded-lg bg-white text-left flex items-center justify-between focus:border-blue-500 focus:outline-none"
                >
                  {selectedTopic ? (
                    <span className="font-semibold">
                      {healthTopics[selectedTopic].title}
                    </span>
                  ) : (
                    <span className="text-gray-500">Select a health topic</span>
                  )}
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                </button>
                {showTopicDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                    {Object.entries(healthTopics).map(([key, topic]) => (
                      <button
                        key={key}
                        onClick={() => {
                          setSelectedTopic(key);
                          setShowTopicDropdown(false);
                        }}
                        className="w-full px-4 py-4 text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg border-b border-gray-100 last:border-b-0"
                      >
                        <span className="font-semibold text-lg">
                          {topic.title}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Preview of English Content */}
            {selectedTopic && (
              <div className="space-y-3">
                <label className="text-lg font-semibold text-gray-800 block">
                  English Content Preview:
                </label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-2 text-blue-700">
                    {healthTopics[selectedTopic].title}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {healthTopics[selectedTopic].content.substring(0, 200)}...
                  </p>
                </div>
              </div>
            )}

            {/* Translate Button */}
            <button
              onClick={translateHealthInfo}
              disabled={isTranslating || !selectedLanguage || !selectedTopic}
              className="w-full h-16 text-lg md:text-xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 disabled:opacity-50 text-white rounded-lg flex items-center justify-center gap-3 transition-all duration-200"
            >
              {isTranslating ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin" />
                  Translating...
                </>
              ) : (
                <>
                  <Languages className="h-6 w-6" />
                  Translate to{" "}
                  {languages.find((l) => l.code === selectedLanguage)?.name ||
                    "Selected Language"}
                </>
              )}
            </button>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-300 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-800 text-base md:text-lg">{error}</p>
                  <button
                    onClick={clearError}
                    className="mt-2 text-sm text-red-700 hover:text-red-900 underline"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* Translated Content */}
            {translatedText && (
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <label className="text-lg md:text-xl font-semibold text-gray-800">
                    Health Information in{" "}
                    {languages.find((l) => l.code === selectedLanguage)?.name}:
                  </label>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-teal-50 border-2 border-blue-200 rounded-lg p-6 md:p-8">
                  <h3 className="font-bold text-xl md:text-2xl mb-4 text-blue-800">
                    {healthTopics[selectedTopic].title}
                  </h3>
                  <div className="prose prose-lg max-w-none">
                    <p className="text-lg md:text-xl leading-relaxed text-gray-800 whitespace-pre-line">
                      {translatedText}
                    </p>
                  </div>
                </div>

                {/* Audio Controls */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={isPlaying ? stopAudio : generateAndPlayAudio}
                    disabled={isGeneratingAudio}
                    className={`h-14 text-base md:text-lg font-semibold flex-1 rounded-lg flex items-center justify-center gap-3 transition-all duration-200 ${
                      isPlaying
                        ? "bg-red-600 hover:bg-red-700 text-white"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-800"
                    } disabled:opacity-50`}
                  >
                    {isGeneratingAudio ? (
                      <>
                        <Loader2 className="h-6 w-6 animate-spin" />
                        Generating Audio...
                      </>
                    ) : isPlaying ? (
                      <>
                        <VolumeX className="h-6 w-6" />
                        Stop Audio
                      </>
                    ) : (
                      <>
                        <Volume2 className="h-6 w-6" />
                        Listen with AI Voice
                      </>
                    )}
                  </button>

                  {(isPlaying || isGeneratingAudio) && (
                    <div className="flex items-center justify-center text-blue-600 font-medium">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                      <span className="ml-2">
                        {isGeneratingAudio
                          ? "Generating..."
                          : "Playing audio..."}
                      </span>
                    </div>
                  )}
                </div>

                {/* Setup Instructions */}
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        <strong>API Setup Required:</strong> To enable real
                        translation and text-to-speech, configure your Sunbird
                        Translate API token and ElevenLabs API key in your
                        environment variables.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-600 py-6">
          <p className="text-sm md:text-base leading-relaxed">
            Powered by Sunbird Translate API & ElevenLabs Text-to-Speech
            <br />
            <span className="text-xs">
              Helping Ugandan communities access vital health information with
              natural voice narration
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
