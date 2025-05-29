"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Volume2, Loader2, Languages, Heart, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const languages = [
  { code: "lug", name: "Luganda", nativeName: "Oluganda" },
  { code: "nyn", name: "Runyankole", nativeName: "Runyankole" },
  { code: "ach", name: "Acholi", nativeName: "Acholi" },
  { code: "teo", name: "Ateso", nativeName: "Ateso" },
  { code: "lgg", name: "Lugbara", nativeName: "Lugbara" },
];

const healthTopics = {
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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState("");

  const translateHealthInfo = async () => {
    if (!selectedLanguage || !selectedTopic) {
      setError("Please select both a language and a health topic");
      return;
    }

    setIsTranslating(true);
    setError("");
    setTranslatedText("");

    const topicData = healthTopics[selectedTopic as keyof typeof healthTopics];
    const englishText = topicData.content;

    try {
      // Get the auth token from environment variables or prompt user
      const authToken =
        process.env.NEXT_PUBLIC_SUNBIRD_AUTH_TOKEN ||
        process.env.REACT_APP_SUNBIRD_AUTH_TOKEN;

      if (!authToken) {
        throw new Error(
          "Authentication token not configured. Please set NEXT_PUBLIC_SUNBIRD_AUTH_TOKEN environment variable."
        );
      }

      // Using Sunbird Translate API with proper authentication
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
        data.output.translated_text ||
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

      if (errorMessage.includes("Authentication token not configured")) {
        setError(
          "API authentication not configured. Please contact the administrator to set up the translation service."
        );
      } else if (errorMessage.includes("401") || errorMessage.includes("403")) {
        setError("Authentication failed. Please check the API credentials.");
      } else if (errorMessage.includes("429")) {
        setError("Too many requests. Please wait a moment and try again.");
      } else {
        setError(
          "Translation failed. Please check your internet connection and try again."
        );
      }

      // Fallback for demo purposes - show that translation would happen
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

  const speakText = () => {
    if (!translatedText || !("speechSynthesis" in window)) {
      setError("Text-to-speech is not available in your browser");
      return;
    }

    setIsSpeaking(true);
    setError("");

    // Stop any ongoing speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(translatedText);

    // Language mapping for better pronunciation
    const langMap: { [key: string]: string } = {
      lug: "sw-KE", // Swahili as fallback for Luganda
      nyn: "sw-KE", // Swahili as fallback for Runyankole
      ach: "sw-KE", // Swahili as fallback for Acholi
      teo: "sw-KE", // Swahili as fallback for Ateso
      lgg: "sw-KE", // Swahili as fallback for Lugbara
    };

    utterance.lang = langMap[selectedLanguage] || "en-US";
    utterance.rate = 0.7; // Slower for better comprehension
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (event) => {
      setIsSpeaking(false);
      setError("Speech synthesis failed. Please try again.");
      console.error("Speech synthesis error:", event);
    };

    speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
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
            Access important health information in your local language
          </p>
        </div>

        {/* Main Content */}
        <Card className="shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-t-lg">
            <CardTitle className="text-xl md:text-2xl flex items-center gap-3">
              <Languages className="h-7 w-7" />
              Get Health Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 md:p-8 space-y-8">
            {/* Language Selection */}
            <div className="space-y-4">
              <Label
                htmlFor="language"
                className="text-lg md:text-xl font-semibold text-gray-800"
              >
                1. Select Your Language
              </Label>
              <Select
                value={selectedLanguage}
                onValueChange={setSelectedLanguage}
              >
                <SelectTrigger className="h-16 text-lg md:text-xl border-2 border-gray-300 focus:border-blue-500">
                  <SelectValue placeholder="Choose your preferred language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem
                      key={lang.code}
                      value={lang.code}
                      className="text-lg md:text-xl py-4"
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold">{lang.name}</span>
                        <span className="text-sm text-gray-600">
                          {lang.nativeName}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Health Topic Selection */}
            <div className="space-y-4">
              <Label
                htmlFor="topic"
                className="text-lg md:text-xl font-semibold text-gray-800"
              >
                2. Choose Health Topic
              </Label>
              <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                <SelectTrigger className="h-16 text-lg md:text-xl border-2 border-gray-300 focus:border-blue-500">
                  <SelectValue placeholder="Select a health topic" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(healthTopics).map(([key, topic]) => (
                    <SelectItem
                      key={key}
                      value={key}
                      className="text-lg md:text-xl py-4"
                    >
                      {topic.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Preview of English Content */}
            {selectedTopic && (
              <div className="space-y-3">
                <Label className="text-lg font-semibold text-gray-800">
                  English Content Preview:
                </Label>
                <Card className="bg-gray-50 border border-gray-200">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2 text-blue-700">
                      {
                        healthTopics[selectedTopic as keyof typeof healthTopics]
                          .title
                      }
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      {healthTopics[
                        selectedTopic as keyof typeof healthTopics
                      ].content.substring(0, 200)}
                      ...
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Translate Button */}
            <Button
              onClick={translateHealthInfo}
              disabled={isTranslating || !selectedLanguage || !selectedTopic}
              className="w-full h-16 text-lg md:text-xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 disabled:opacity-50"
              size="lg"
            >
              {isTranslating ? (
                <>
                  <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                  Translating...
                </>
              ) : (
                <>
                  <Languages className="mr-3 h-6 w-6" />
                  Translate to{" "}
                  {languages.find((l) => l.code === selectedLanguage)?.name ||
                    "Selected Language"}
                </>
              )}
            </Button>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive" className="border-red-300">
                <AlertCircle className="h-5 w-5" />
                <AlertDescription className="text-base md:text-lg">
                  {error}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearError}
                    className="ml-2 text-red-700 hover:text-red-900"
                  >
                    Dismiss
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Translated Content */}
            {translatedText && (
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <Label className="text-lg md:text-xl font-semibold text-gray-800">
                    Health Information in{" "}
                    {languages.find((l) => l.code === selectedLanguage)?.name}:
                  </Label>
                </div>

                <Card className="bg-gradient-to-br from-blue-50 to-teal-50 border-2 border-blue-200">
                  <CardContent className="p-6 md:p-8">
                    <h3 className="font-bold text-xl md:text-2xl mb-4 text-blue-800">
                      {
                        healthTopics[selectedTopic as keyof typeof healthTopics]
                          .title
                      }
                    </h3>
                    <div className="prose prose-lg max-w-none">
                      <p className="text-lg md:text-xl leading-relaxed text-gray-800 whitespace-pre-line">
                        {translatedText}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Audio Controls */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    onClick={isSpeaking ? stopSpeaking : speakText}
                    variant={isSpeaking ? "destructive" : "secondary"}
                    className="h-14 text-base md:text-lg font-semibold flex-1"
                    size="lg"
                  >
                    <Volume2 className="mr-3 h-6 w-6" />
                    {isSpeaking ? "Stop Audio" : "Listen to Translation"}
                  </Button>

                  {isSpeaking && (
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
                      <span className="ml-2">Playing audio...</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-gray-600 py-6">
          <p className="text-sm md:text-base leading-relaxed">
            Powered by Sunbird Translate API
            <br />
            <span className="text-xs">
              Helping Ugandan communities access vital health information
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
