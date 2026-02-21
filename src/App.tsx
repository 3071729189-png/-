/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  Layers, 
  Star, 
  MessageCircle, 
  Highlighter, 
  Camera, 
  Volume2, 
  ChevronRight, 
  Search,
  Mic,
  Upload,
  Info,
  Loader2,
  X,
  Play,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { geminiService } from './services/geminiService';
import { Word, Etymology, PageType } from './types';

const TITLE_TRANSLATIONS: Record<string, Record<PageType, string>> = {
  English: {
    recommendation: 'Vocabulary Recommendation',
    etymology: 'Etymology Deconstruction',
    vocabulary: 'Smart Vocabulary',
    dialogue: 'Contextual Review',
    translation: 'Translation Annotation',
    recognition: 'Image Recognition'
  },
  German: {
    recommendation: 'Wortschatz-Empfehlung',
    etymology: 'Etymologie-Dekonstruktion',
    vocabulary: 'Intelligenter Wortschatz',
    dialogue: 'Kontextuelle Überprüfung',
    translation: 'Übersetzungs-Annotation',
    recognition: 'Bilderkennung'
  },
  French: {
    recommendation: 'Recommandation de vocabulaire',
    etymology: 'Déconstruction étymologique',
    vocabulary: 'Vocabulaire intelligent',
    dialogue: 'Révision contextuelle',
    translation: 'Annotation de traduction',
    recognition: 'Reconnaissance d\'image'
  },
  Japanese: {
    recommendation: '語彙の推奨',
    etymology: '語源の解体',
    vocabulary: 'スマート語彙',
    dialogue: '文脈による復習',
    translation: '翻訳注釈',
    recognition: '画像認識'
  }
};

export default function App() {
  const [activePage, setActivePage] = useState<PageType>('recommendation');
  const [nativeLang, setNativeLang] = useState('English');
  const [level, setLevel] = useState('HSK 3');
  const [loading, setLoading] = useState(false);
  
  // State for different pages
  const [recommendedWords, setRecommendedWords] = useState<Word[]>([]);
  const [currentEtymology, setCurrentEtymology] = useState<{word: string, data: Etymology} | null>(null);
  const [vocabulary, setVocabulary] = useState<Word[]>([
    { word: '发票', pinyin: 'Fā piào', meaning: 'Receipt / Invoice', proficiency: 45, category: 'Business', isFavorite: true, isSelected: true },
    { word: '登机牌', pinyin: 'Dēng jī pái', meaning: 'Boarding Pass', proficiency: 80, category: 'Travel', isFavorite: false, isSelected: true },
    { word: '矛盾', pinyin: 'Máo dùn', meaning: 'Contradiction', proficiency: 65, category: 'General', isFavorite: false, isSelected: true },
    { word: '内卷', pinyin: 'Nèi juǎn', meaning: 'Involution', proficiency: 20, category: 'Culture', isFavorite: true, isSelected: true },
    { word: '咖啡', pinyin: 'Kā fēi', meaning: 'Coffee', proficiency: 95, category: 'Daily', isFavorite: false, isSelected: true }
  ]);
  
  // Review Mode State
  const [reviewData, setReviewData] = useState<any>(null);
  const [reviewAnswers, setReviewAnswers] = useState<Record<number, string>>({});
  const [reviewStep, setReviewStep] = useState(0);

  const [chatHistory, setChatHistory] = useState<{role: string, text: string}[]>([]);
  const [imageResult, setImageResult] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (activePage === 'recommendation' && recommendedWords.length === 0) {
      fetchRecommendations();
    }
  }, [activePage]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const words = await geminiService.getVocabularyRecommendations(nativeLang, level);
      setRecommendedWords(words);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEtymology = async (word: string) => {
    setLoading(true);
    try {
      const data = await geminiService.getEtymology(word);
      setCurrentEtymology({ word, data });
      setActivePage('etymology');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const startTargetedReview = async () => {
    const selected = vocabulary.filter(w => w.isSelected);
    if (selected.length === 0) return;
    
    setLoading(true);
    try {
      const data = await geminiService.getReviewDialogue(selected);
      setReviewData(data);
      setReviewAnswers({});
      setReviewStep(0);
      setActivePage('dialogue');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const playTTS = async (text: string) => {
    try {
      const base64 = await geminiService.generateSpeech(text);
      if (base64) {
        const audio = new Audio(`data:audio/mp3;base64,${base64}`);
        audio.play();
      }
    } catch (error) {
      console.error("TTS failed", error);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        setCapturedImage(reader.result as string);
        setLoading(true);
        try {
          const result = await geminiService.analyzeImage(base64);
          setImageResult(result);
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleWordSelection = (index: number) => {
    const newVocab = [...vocabulary];
    newVocab[index].isSelected = !newVocab[index].isSelected;
    setVocabulary(newVocab);
  };

  const renderPage = () => {
    const pageTitle = TITLE_TRANSLATIONS[nativeLang]?.[activePage] || '';
    
    switch (activePage) {
      case 'recommendation':
        return (
          <div className="p-5">
            <h2 className="text-lg font-bold text-gugong-red mb-1 border-l-4 border-gugong-red pl-2">母语适配词库推荐系统</h2>
            <p className="text-xs text-gray-400 mb-4 pl-3">{pageTitle}</p>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-4">
              <p className="text-xs text-gray-500 mb-2">Based on your Native Language ({nativeLang}) & Level ({level})</p>
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold text-gray-800">高频核心词汇推荐</span>
                <button onClick={fetchRecommendations} className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded hover:bg-red-200 transition-colors">
                  {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : '刷新推荐'}
                </button>
              </div>
              <div className="space-y-2">
                {recommendedWords.map((w, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex justify-between items-center bg-gray-50 p-3 rounded-lg cursor-pointer hover:bg-gray-100"
                    onClick={() => fetchEtymology(w.word)}
                  >
                    <div>
                      <p className="text-lg font-bold">{w.word} ({w.pinyin})</p>
                      <p className="text-sm text-gray-600">{w.meaning}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">熟练度</p>
                      <p className={`${w.proficiency > 50 ? 'text-celadon-green' : 'text-yellow-600'} font-bold`}>{w.proficiency}%</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'etymology':
        return (
          <div className="p-5">
            <h2 className="text-lg font-bold text-gugong-red mb-1 border-l-4 border-gugong-red pl-2">字源解构可视化单词卡</h2>
            <p className="text-xs text-gray-400 mb-4 pl-3">{pageTitle}</p>
            {currentEtymology ? (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden relative"
              >
                <button className="absolute top-3 right-3 text-gray-400 hover:text-red-500"><Volume2 className="w-5 h-5" /></button>
                <div className="p-8 text-center bg-red-50/30">
                  <h1 className="text-6xl font-bold text-gugong-red mb-2">{currentEtymology.word}</h1>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-gray-800 mb-3 text-sm">字源拆解 (Etymology Breakdown)</h3>
                  <div className="flex flex-col gap-4 mb-4">
                    {currentEtymology.data.components.map((c, i) => (
                      <div key={i} className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <div className="w-16 h-16 bg-white rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                          {c.imageUrl ? (
                            <img src={c.imageUrl} className="w-full h-full object-cover" alt={c.char} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-200"><Layers className="w-6 h-6" /></div>
                          )}
                        </div>
                        <div>
                          <span className="text-2xl font-bold text-blue-800">{c.char}</span>
                          <p className="text-xs text-gray-600 mt-1">{c.meaning}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <h3 className="font-bold text-gray-800 mb-2 text-sm">文化来源 (Cultural Context)</h3>
                  <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg">
                    {currentEtymology.data.culturalContext}
                  </p>
                </div>
              </motion.div>
            ) : (
              <div className="text-center py-20 text-gray-400">
                <Layers className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>点击推荐词汇查看字源解构</p>
              </div>
            )}
          </div>
        );
      case 'vocabulary':
        return (
          <div className="p-5">
            <h2 className="text-lg font-bold text-gugong-red mb-1 border-l-4 border-gugong-red pl-2">个性化智能单词本</h2>
            <p className="text-xs text-gray-400 mb-4 pl-3">{pageTitle}</p>
            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
              <span className="bg-gugong-red text-white text-xs px-3 py-1.5 rounded-full whitespace-nowrap">全部 (All)</span>
              <span className="bg-gray-200 text-gray-700 text-xs px-3 py-1.5 rounded-full whitespace-nowrap">💼 商务 (Business)</span>
              <span className="bg-gray-200 text-gray-700 text-xs px-3 py-1.5 rounded-full whitespace-nowrap">✈️ 旅游 (Travel)</span>
            </div>
            <div className="space-y-3">
              {vocabulary.map((w, i) => (
                <div key={i} className={`bg-white p-3 rounded-xl shadow-sm flex items-center justify-between border-l-4 ${w.proficiency < 50 ? 'border-yellow-400' : 'border-celadon-green'}`}>
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      checked={w.isSelected} 
                      onChange={() => toggleWordSelection(i)}
                      className="w-4 h-4 accent-gugong-red cursor-pointer" 
                    />
                    <div>
                      <p className="font-bold">{w.word} ({w.pinyin})</p>
                      <p className="text-xs text-gray-500">{w.meaning}</p>
                    </div>
                  </div>
                  <Star className={`w-5 h-5 ${w.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                </div>
              ))}
            </div>
            <button 
              onClick={startTargetedReview}
              disabled={loading || vocabulary.filter(w => w.isSelected).length === 0}
              className="w-full mt-6 bg-gugong-red text-white py-3 rounded-xl font-bold shadow-lg hover:bg-red-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
              开启针对性复习
            </button>
          </div>
        );
      case 'dialogue':
        return (
          <div className="p-5 h-full flex flex-col">
            <h2 className="text-lg font-bold text-gugong-red mb-1 border-l-4 border-gugong-red pl-2">情境式对话复习</h2>
            <p className="text-xs text-gray-400 mb-4 pl-3">{pageTitle}</p>
            
            {reviewData ? (
              <div className="flex-1 flex flex-col">
                <div className="bg-blue-50 p-3 rounded-xl mb-4 border border-blue-100">
                  <p className="text-xs font-bold text-blue-800 mb-1">当前情境 (Scenario):</p>
                  <p className="text-xs text-blue-600">{reviewData.scenario}</p>
                </div>
                
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 mb-4">
                  {reviewData.dialogue.slice(0, reviewStep + 1).map((line: any, i: number) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, x: line.speaker === 'User' ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex gap-3 ${line.speaker === 'User' ? 'flex-row-reverse' : ''}`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-2 ${line.speaker === 'User' ? 'bg-red-100 border-red-200' : 'bg-blue-100 border-blue-200'}`}>
                        {line.speaker === 'User' ? <Star className="w-5 h-5 text-red-500" /> : <div className="text-xs font-bold text-blue-500">小通</div>}
                      </div>
                      <div className={`p-3 rounded-2xl text-sm max-w-[80%] shadow-sm ${line.speaker === 'User' ? 'bg-white border border-red-100 rounded-tr-none' : 'bg-white border border-blue-100 rounded-tl-none'}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold opacity-50 uppercase tracking-wider">{line.speaker}</span>
                          {line.speaker === 'Xiao Tong' && (
                            <button onClick={() => playTTS(line.text)} className="text-blue-500 hover:text-blue-700"><Volume2 className="w-3 h-3" /></button>
                          )}
                        </div>
                        
                        {line.speaker === 'User' && line.blankWord ? (
                          <div>
                            <p className="text-lg">
                              {line.text.split('____').map((part: string, idx: number) => (
                                <React.Fragment key={idx}>
                                  {part}
                                  {idx === 0 && (
                                    <span className="inline-block border-b-2 border-gugong-red min-w-[60px] text-center text-gugong-red font-bold">
                                      {reviewAnswers[i] || '____'}
                                    </span>
                                  )}
                                </React.Fragment>
                              ))}
                            </p>
                            {line.hintImageUrl && (
                              <div className="mt-2 w-24 h-24 rounded-lg overflow-hidden border border-gray-100 mx-auto">
                                <img src={line.hintImageUrl} className="w-full h-full object-cover" alt="hint" />
                              </div>
                            )}
                            <div className="mt-3 flex flex-wrap gap-2">
                              {vocabulary.filter(w => w.isSelected).map((w, idx) => (
                                <button 
                                  key={idx}
                                  onClick={() => {
                                    setReviewAnswers(prev => ({ ...prev, [i]: w.word }));
                                    if (w.word === line.blankWord) {
                                      if (reviewStep < reviewData.dialogue.length - 1) {
                                        setReviewStep(prev => prev + 1);
                                      }
                                    }
                                  }}
                                  className={`text-xs px-3 py-1 rounded-full border transition-all ${reviewAnswers[i] === w.word ? 'bg-gugong-red text-white border-gugong-red' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gugong-red'}`}
                                >
                                  {w.word}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p className="text-lg">{line.text}</p>
                            <p className="text-[10px] text-gray-400 mt-1">{line.pinyin}</p>
                            <p className="text-[10px] italic text-gray-500">{line.translation}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  {reviewStep === reviewData.dialogue.length - 1 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-4">
                      <div className="inline-flex items-center gap-2 bg-celadon-green text-white px-4 py-2 rounded-full text-sm font-bold">
                        <CheckCircle2 className="w-4 h-4" /> 复习完成！
                      </div>
                      <button onClick={() => setReviewData(null)} className="block mx-auto mt-2 text-xs text-gray-400 underline">返回普通对话</button>
                    </motion.div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 mb-4 bg-white/50 p-4 rounded-xl border border-gray-100">
                  {chatHistory.length === 0 && (
                    <div className="text-center text-gray-400 py-10">
                      <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-20" />
                      <p>开始一段中文对话吧！</p>
                    </div>
                  )}
                  {chatHistory.map((msg, i) => (
                    <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-red-100' : 'bg-blue-100'}`}>
                        {msg.role === 'user' ? <Star className="w-4 h-4 text-red-500" /> : <div className="text-[10px] font-bold text-blue-500">小通</div>}
                      </div>
                      <div className={`p-3 rounded-2xl text-sm max-w-[80%] ${msg.role === 'user' ? 'bg-red-50 border border-red-100 rounded-tr-none' : 'bg-white border border-blue-100 rounded-tl-none'}`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="输入中文或英文..." 
                    className="flex-1 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gugong-red"
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter' && e.currentTarget.value) {
                        const val = e.currentTarget.value;
                        e.currentTarget.value = '';
                        setChatHistory(prev => [...prev, { role: 'user', text: val }]);
                        const response = await geminiService.getDialogueResponse(chatHistory, val);
                        setChatHistory(prev => [...prev, { role: 'ai', text: response || '' }]);
                      }
                    }}
                  />
                  <button className="bg-gugong-red text-white p-2 rounded-full"><Mic className="w-5 h-5" /></button>
                </div>
              </div>
            )}
          </div>
        );
      case 'translation':
        return (
          <div className="p-5">
            <h2 className="text-lg font-bold text-gugong-red mb-1 border-l-4 border-gugong-red pl-2">沉浸式智能翻译标注</h2>
            <p className="text-xs text-gray-400 mb-4 pl-3">{pageTitle}</p>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center mb-4 bg-white cursor-pointer hover:border-gugong-red transition-colors">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">上传 PDF 或输入网页链接</p>
              <p className="text-xs text-gray-400 mt-1">(AI will annotate key terms for you)</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-sm font-bold text-gray-800 mb-2">智能标注预览 (Preview)</h3>
              <p className="text-sm leading-relaxed text-gray-700 font-serif">
                China's <span className="bg-yellow-200 text-black px-1 rounded cursor-pointer relative group">economy<span className="absolute hidden group-hover:block bg-black text-white text-xs p-2 rounded -top-8 left-0 whitespace-nowrap z-20">经济 (Jīng jì)</span></span> 
                has been growing rapidly over the past few decades. The rapid development of 
                <span className="bg-yellow-200 text-black px-1 rounded cursor-pointer relative group">infrastructure<span className="absolute hidden group-hover:block bg-black text-white text-xs p-2 rounded -top-8 left-0 whitespace-nowrap z-20">基础设施 (Jī chǔ shè shī)</span></span> 
                is evident in major cities.
              </p>
              <p className="text-xs text-gray-400 mt-3 flex items-center"><Info className="w-3 h-3 mr-1" /> 点击高亮词汇查看单词卡</p>
            </div>
          </div>
        );
      case 'recognition':
        return (
          <div className="p-5">
            <h2 className="text-lg font-bold text-gugong-red mb-1 border-l-4 border-gugong-red pl-2">实景图像中文识别</h2>
            <p className="text-xs text-gray-400 mb-4 pl-3">{pageTitle}</p>
            
            <div className="mb-6">
              <p className="text-xs font-bold text-gray-500 mb-2">示例实景 (Sample Scenes):</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { url: 'https://images.unsplash.com/photo-1576487190184-4860cc514ce1?q=80&w=300&auto=format&fit=crop', label: '路牌 (Sign)' },
                  { url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=300&auto=format&fit=crop', label: '菜单 (Menu)' }
                ].map((img, i) => (
                  <div 
                    key={i} 
                    onClick={() => {
                      setCapturedImage(img.url);
                      setImageResult(i === 0 ? "路牌识别结果:\n禁止停车 (Jìn zhǐ tíng chē)\nNo Parking" : "菜单识别结果:\n宫保鸡丁 (Gōng bǎo jī dīng)\nKung Pao Chicken");
                    }}
                    className="relative rounded-lg overflow-hidden h-24 cursor-pointer border-2 border-transparent hover:border-gugong-red transition-all"
                  >
                    <img src={img.url} className="w-full h-full object-cover" alt={img.label} />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <span className="text-[10px] text-white font-bold">{img.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative w-full h-[250px] bg-gray-900 rounded-xl overflow-hidden shadow-inner mb-4 flex items-center justify-center border-2 border-dashed border-gray-700">
              {capturedImage ? (
                <img src={capturedImage} className="w-full h-full object-cover" alt="Captured" />
              ) : (
                <div className="text-center text-white/50">
                  <Camera className="w-10 h-10 mx-auto mb-2" />
                  <p className="text-xs">上传或拍摄照片识别中文</p>
                </div>
              )}
              <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                className="absolute inset-0 opacity-0 cursor-pointer" 
                onChange={handleImageUpload}
              />
              {loading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
            </div>
            {imageResult && (
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-white p-4 rounded-xl shadow-sm border border-gray-100"
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-gray-800 text-sm">识别结果:</h3>
                  <button onClick={() => {setCapturedImage(null); setImageResult(null);}} className="text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                </div>
                <div className="text-sm text-gray-700 whitespace-pre-wrap font-serif">
                  {imageResult}
                </div>
              </motion.div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <div className="app-container w-full max-w-md h-[850px] bg-paper-white shadow-2xl overflow-hidden flex flex-col relative sm:rounded-[2.5rem] sm:border-8 border-gray-800">
        
        {/* Header */}
        <header className="bg-gugong-red text-white p-4 flex justify-between items-center shadow-md z-10">
          <div>
            <h1 className="text-xl font-bold tracking-wider">五洲汉语通</h1>
            <p className="text-[10px] opacity-70 font-sans tracking-widest">SinoLink Global</p>
          </div>
          <div className="flex items-center gap-2">
            <select 
              value={nativeLang}
              onChange={(e) => setNativeLang(e.target.value)}
              className="bg-transparent border border-white/50 text-xs rounded px-2 py-1 outline-none text-white appearance-none cursor-pointer"
            >
              <option value="English" className="text-black">🇬🇧 EN</option>
              <option value="German" className="text-black">🇩🇪 DE</option>
              <option value="French" className="text-black">🇫🇷 FR</option>
              <option value="Japanese" className="text-black">🇯🇵 JA</option>
            </select>
            <select 
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="bg-transparent border border-white/50 text-xs rounded px-2 py-1 outline-none text-white appearance-none cursor-pointer"
            >
              <option value="HSK 1" className="text-black">HSK 1</option>
              <option value="HSK 2" className="text-black">HSK 2</option>
              <option value="HSK 3" className="text-black">HSK 3</option>
              <option value="HSK 4" className="text-black">HSK 4</option>
            </select>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto no-scrollbar pb-24 bg-[url('https://www.transparenttextures.com/patterns/rice-paper-2.png')]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom Navigation */}
        <nav className="bg-white border-t border-gray-200 absolute bottom-0 w-full z-20 pb-6 pt-2">
          <ul className="flex overflow-x-auto no-scrollbar px-2 gap-2">
            {[
              { id: 'recommendation', icon: BookOpen, label: '词库推荐' },
              { id: 'etymology', icon: Layers, label: '字源单词' },
              { id: 'vocabulary', icon: Star, label: '智能单词' },
              { id: 'dialogue', icon: MessageCircle, label: '情境复习' },
              { id: 'translation', icon: Highlighter, label: '翻译标注' },
              { id: 'recognition', icon: Camera, label: '实景识别' },
            ].map((item) => (
              <li 
                key={item.id}
                onClick={() => setActivePage(item.id as PageType)}
                className={`flex flex-col items-center justify-center min-w-[4.5rem] cursor-pointer transition-all p-2 rounded-lg ${activePage === item.id ? 'text-gugong-red bg-red-50' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <item.icon className={`w-6 h-6 mb-1 ${activePage === item.id ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
                <span className="text-[0.65rem] font-medium whitespace-nowrap">{item.label}</span>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
