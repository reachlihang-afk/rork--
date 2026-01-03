import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { ArrowLeft, Upload, Search, Share2, Camera } from 'lucide-react-native';
import { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useVerification } from '@/contexts/VerificationContext';
import { useCoin } from '@/contexts/CoinContext';
import { generateText } from '@rork-ai/toolkit-sdk';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import { captureRef } from 'react-native-view-shot';
import ShareableImageSourceResult from '@/components/ShareableImageSourceResult';
import { saveToGallery } from '@/utils/share';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';

interface AnalysisResult {
  description: string;
  keywords: string[];
  possibleSources: string[];
  suggestions: string;
  entityInfo?: {
    type: 'person' | 'animal' | 'plant' | 'other';
    name?: string;
    introduction?: string;
  };
}

export default function ImageSourceScreen() {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const router = useRouter();
  const { addImageSourceHistory, imageSourceHistory } = useVerification();
  const { canUseImageSource, useImageSource: consumeImageSource } = useCoin();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [currentRecordId, setCurrentRecordId] = useState<string | null>(null);
  const shareViewRef = useRef<View>(null);
  const [isSharing, setIsSharing] = useState(false);

  const pickImage = async (source: 'camera' | 'library') => {
    try {
      let result;
      
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(t('errors.permissionDenied'), t('errors.permissionDenied'));
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [3, 4],
          quality: 0.8,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(t('errors.permissionDenied'), t('errors.permissionDenied'));
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [3, 4],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        setAnalysis(null);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(t('common.error'), t('errors.uploadError'));
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;

    const { canUse, message } = canUseImageSource();
    if (!canUse) {
      Alert.alert(t('common.error'), message, [
        { text: t('common.confirm') },
        message.includes(t('profile.recharge')) && {
          text: t('profile.recharge'),
          onPress: () => router.push('/recharge')
        }
      ].filter(Boolean) as any);
      return;
    }

    const consumed = await consumeImageSource();
    if (!consumed) {
      Alert.alert(t('common.error'), t('errors.uploadError'));
      return;
    }

    setIsAnalyzing(true);
    setElapsedTime(0);
    
    const startTime = Date.now();
    const timeInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedTime(elapsed);
    }, 1000);
    
    try {
      console.log('Starting image source analysis...');
      console.log('Compressing and converting image to base64...');
      
      let base64: string;
      try {
        const manipulated = await ImageManipulator.manipulateAsync(
          selectedImage,
          [{ resize: { width: 1024 } }],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );
        base64 = await FileSystem.readAsStringAsync(manipulated.uri, {
          encoding: 'base64',
        });
      } catch (compressError) {
        console.warn('Image compression failed, using original:', compressError);
        base64 = await FileSystem.readAsStringAsync(selectedImage, {
          encoding: 'base64',
        });
      }
      console.log('Image converted, base64 length:', base64.length);

      console.log('Calling AI API for image analysis...');
      
      const prompts: Record<string, string> = {
        zh: `你是一个专业的图像识别专家，请仔细分析这张图片并帮助用户找到它的来源。

**步骤1：主体识别（最重要）**
如果图片中有人物，请非常仔细地进行识别：
- 详细观察面部特征、五官、发型、表情
- 分析人物的年龄段、性别、种族特征
- 观察图片场景、背景、服装、道具等上下文线索
- 判断是否为公众人物（明星、演员、歌手、政治家、运动员、网红、企业家等）
- 如果是公众人物，请给出准确的中文全名（如适用，也包括英文名）
- 说明识别依据（如：特征性的五官、发型、出现场合、服装风格等）
- 如果有多个可能匹配，请按可能性大小列出前2-3个候选人名

如果图片中是动物或植物：
- 提供中文名称和学名
- 详细介绍其特征、习性、分布地区
- 说明识别依据

**步骤2：内容分析**
- 提供图片的详细描述（场景、环境、活动、氛围等）
- 分析图片的拍摄风格和用途（如：写真、活动照、剧照、新闻图等）

**步骤3：搜索辅助**
- 提供5-10个精准的关键搜索词
- 列出3-5个可能的图片来源类型
- 给出具体的搜索建议

请严格按照以下格式用中文回答：
类型：[person/animal/plant/other]
名称：[人物全名/动植物名称，如果不确定请说明]
介绍：[详细介绍，包括职业/领域/特征等。如果是人物，说明识别依据]
描述：[图片内容的详细描述]
关键词：[词1], [词2], [词3]...
可能来源：[来源1], [来源2], [来源3]...
建议：[具体的搜索建议]`,
        en: `You are a professional image recognition expert. Please carefully analyze this image and help the user find its source.

**Step 1: Subject Identification (Most Important)**
If there are people in the image, please identify them very carefully:
- Observe facial features, facial structure, hairstyle, and expression in detail
- Analyze the person's age range, gender, and ethnic characteristics
- Observe the scene, background, clothing, props, and other contextual clues
- Determine if they are a public figure (celebrity, actor, singer, politician, athlete, influencer, entrepreneur, etc.)
- If they are a public figure, provide their accurate full name (including English name if applicable)
- Explain the identification basis (e.g., distinctive facial features, hairstyle, occasion, clothing style, etc.)
- If there are multiple possible matches, list the top 2-3 candidates by likelihood

If the image contains animals or plants:
- Provide the common name and scientific name
- Describe their characteristics, habits, and distribution areas in detail
- Explain the identification basis

**Step 2: Content Analysis**
- Provide a detailed description of the image (scene, environment, activities, atmosphere, etc.)
- Analyze the photography style and purpose (e.g., portrait, event photo, movie still, news photo, etc.)

**Step 3: Search Assistance**
- Provide 5-10 precise search keywords
- List 3-5 possible image source types
- Provide specific search suggestions

Please respond strictly in the following format in English:
Type: [person/animal/plant/other]
Name: [Full name/species name, indicate if uncertain]
Introduction: [Detailed introduction including occupation/field/characteristics. For people, explain identification basis]
Description: [Detailed description of image content]
Keywords: [word1], [word2], [word3]...
Possible Sources: [source1], [source2], [source3]...
Suggestions: [Specific search suggestions]`,
        ja: `あなたはプロの画像認識専門家です。この画像を注意深く分析し、ユーザーがその出所を見つけるのを助けてください。

**ステップ1：被写体の識別（最も重要）**
画像に人物がいる場合は、非常に注意深く識別してください：
- 顔の特徴、顔の構造、髪型、表情を詳細に観察する
- 人物の年齢層、性別、民族的特徴を分析する
- シーン、背景、服装、小道具などの文脈的手がかりを観察する
- 公人（有名人、俳優、歌手、政治家、スポーツ選手、インフルエンサー、起業家など）かどうかを判断する
- 公人の場合は、正確なフルネーム（該当する場合は英語名も含む）を提供する
- 識別根拠を説明する（例：特徴的な顔立ち、髪型、出現場所、服装スタイルなど）
- 複数の可能性がある場合は、可能性の高い順に上位2〜3人の候補者をリストする

画像に動物や植物が含まれている場合：
- 一般名と学名を提供する
- 特徴、習性、分布地域を詳しく説明する
- 識別根拠を説明する

**ステップ2：コンテンツ分析**
- 画像の詳細な説明を提供する（シーン、環境、活動、雰囲気など）
- 撮影スタイルと目的を分析する（例：ポートレート、イベント写真、映画のスチール、ニュース写真など）

**ステップ3：検索支援**
- 5〜10個の正確な検索キーワードを提供する
- 3〜5個の可能な画像ソースタイプをリストする
- 具体的な検索提案を提供する

以下の形式で日本語で厳密に回答してください：
タイプ：[person/animal/plant/other]
名前：[フルネーム/種名、不確かな場合は明記する]
紹介：[職業/分野/特徴を含む詳細な紹介。人物の場合は識別根拠を説明する]
説明：[画像内容の詳細な説明]
キーワード：[語1]、[語2]、[語3]...
可能な出所：[出所1]、[出所2]、[出所3]...
提案：[具体的な検索提案]`,
        ko: `당신은 전문 이미지 인식 전문가입니다. 이 이미지를 주의 깊게 분석하고 사용자가 출처를 찾을 수 있도록 도와주세요.

**단계 1: 주제 식별 (가장 중요)**
이미지에 사람이 있는 경우 매우 주의 깊게 식별하세요:
- 얼굴 특징, 얼굴 구조, 헤어스타일, 표정을 자세히 관찰
- 인물의 연령대, 성별, 민족적 특징 분석
- 장면, 배경, 의상, 소품 등의 맥락적 단서 관찰
- 공인(유명인, 배우, 가수, 정치인, 운동선수, 인플루언서, 기업가 등)인지 판단
- 공인인 경우 정확한 전체 이름 제공(해당되는 경우 영어 이름도 포함)
- 식별 근거 설명(예: 특징적인 얼굴 특징, 헤어스타일, 출현 장소, 의상 스타일 등)
- 여러 가능성이 있는 경우 가능성 순으로 상위 2-3명의 후보 나열

이미지에 동물이나 식물이 포함된 경우:
- 일반 이름과 학명 제공
- 특징, 습성, 분포 지역을 자세히 설명
- 식별 근거 설명

**단계 2: 콘텐츠 분석**
- 이미지에 대한 자세한 설명 제공(장면, 환경, 활동, 분위기 등)
- 촬영 스타일과 목적 분석(예: 인물 사진, 이벤트 사진, 영화 스틸, 뉴스 사진 등)

**단계 3: 검색 지원**
- 5-10개의 정확한 검색 키워드 제공
- 3-5개의 가능한 이미지 출처 유형 나열
- 구체적인 검색 제안 제공

다음 형식에 따라 한국어로 엄격하게 답변하세요:
유형: [person/animal/plant/other]
이름: [전체 이름/종명, 불확실한 경우 명시]
소개: [직업/분야/특징을 포함한 자세한 소개. 인물의 경우 식별 근거 설명]
설명: [이미지 내용에 대한 자세한 설명]
키워드: [단어1], [단어2], [단어3]...
가능한 출처: [출처1], [출처2], [출처3]...
제안: [구체적인 검색 제안]`,
      };
      
      const promptText = prompts[currentLanguage] || prompts.zh;
      
      const response = await generateText({
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: promptText,
              },
              {
                type: 'image',
                image: base64,
              },
            ],
          },
        ],
      });

      console.log('AI API response received');
      console.log('Response type:', typeof response);
      const text = typeof response === 'string' ? response : '';
      console.log('Response text length:', text.length);
      
      const patterns: Record<string, { type: RegExp; name: RegExp; intro: RegExp; desc: RegExp; keywords: RegExp; sources: RegExp; suggestions: RegExp }> = {
        zh: {
          type: /类型[：:](.*?)(?=名称|描述|$)/s,
          name: /名称[：:](.*?)(?=介绍|描述|$)/s,
          intro: /介绍[：:](.*?)(?=描述|$)/s,
          desc: /描述[：:](.*?)(?=关键词|$)/s,
          keywords: /关键词[：:](.*?)(?=可能来源|$)/s,
          sources: /可能来源[：:](.*?)(?=建议|$)/s,
          suggestions: /建议[：:](.*?)$/s,
        },
        en: {
          type: /Type[：:](.*?)(?=Name|Description|$)/is,
          name: /Name[：:](.*?)(?=Introduction|Description|$)/is,
          intro: /Introduction[：:](.*?)(?=Description|$)/is,
          desc: /Description[：:](.*?)(?=Keywords|$)/is,
          keywords: /Keywords[：:](.*?)(?=Possible Sources|$)/is,
          sources: /Possible Sources[：:](.*?)(?=Suggestions|$)/is,
          suggestions: /Suggestions[：:](.*?)$/is,
        },
        ja: {
          type: /タイプ[：:](.*?)(?=名前|説明|$)/s,
          name: /名前[：:](.*?)(?=紹介|説明|$)/s,
          intro: /紹介[：:](.*?)(?=説明|$)/s,
          desc: /説明[：:](.*?)(?=キーワード|$)/s,
          keywords: /キーワード[：:](.*?)(?=可能な出所|$)/s,
          sources: /可能な出所[：:](.*?)(?=提案|$)/s,
          suggestions: /提案[：:](.*?)$/s,
        },
        ko: {
          type: /유형[：:](.*?)(?=이름|설명|$)/s,
          name: /이름[：:](.*?)(?=소개|설명|$)/s,
          intro: /소개[：:](.*?)(?=설명|$)/s,
          desc: /설명[：:](.*?)(?=키워드|$)/s,
          keywords: /키워드[：:](.*?)(?=가능한 출처|$)/s,
          sources: /가능한 출처[：:](.*?)(?=제안|$)/s,
          suggestions: /제안[：:](.*?)$/s,
        },
      };
      
      const pattern = patterns[currentLanguage] || patterns.zh;
      
      const typeMatch = text.match(pattern.type);
      const nameMatch = text.match(pattern.name);
      const introMatch = text.match(pattern.intro);
      const descMatch = text.match(pattern.desc);
      const keywordsMatch = text.match(pattern.keywords);
      const sourcesMatch = text.match(pattern.sources);
      const suggestionsMatch = text.match(pattern.suggestions);

      const entityType = typeMatch ? typeMatch[1].trim().toLowerCase() : 'other';
      const entityName = nameMatch ? nameMatch[1].trim() : undefined;
      const entityIntro = introMatch ? introMatch[1].trim() : undefined;
      const description = descMatch ? descMatch[1].trim() : (currentLanguage === 'en' ? 'Unable to analyze image content' : currentLanguage === 'ja' ? '画像の内容を分析できません' : currentLanguage === 'ko' ? '이미지 내용을 분석할 수 없습니다' : '无法分析图片内容');
      const keywords = keywordsMatch 
        ? keywordsMatch[1].split(/[,，]/).map((k: string) => k.trim()).filter(Boolean)
        : [];
      const possibleSources = sourcesMatch
        ? sourcesMatch[1].split(/[,，]/).map((s: string) => s.trim()).filter(Boolean)
        : [];
      const suggestions = suggestionsMatch ? suggestionsMatch[1].trim() : (currentLanguage === 'en' ? 'No suggestions available' : currentLanguage === 'ja' ? '提案なし' : currentLanguage === 'ko' ? '제안 없음' : '暂无建议');

      let entityInfo: AnalysisResult['entityInfo'] = undefined;
      if (entityName || entityIntro) {
        let finalType: 'person' | 'animal' | 'plant' | 'other' = 'other';
        if (entityType === 'person') {
          finalType = 'person';
        } else if (entityType === 'animal') {
          finalType = 'animal';
        } else if (entityType === 'plant') {
          finalType = 'plant';
        }
        
        entityInfo = {
          type: finalType,
          name: entityName,
          introduction: entityIntro,
        };
      }

      const analysisResult = {
        description,
        keywords,
        possibleSources,
        suggestions,
        entityInfo,
      };
      
      clearInterval(timeInterval);
      setAnalysis(analysisResult);
      
      if (selectedImage) {
        const recordId = await addImageSourceHistory(selectedImage, analysisResult);
        setCurrentRecordId(recordId);
      }
    } catch (error) {
      clearInterval(timeInterval);
      console.error('Analysis error:', error);
      console.error('Error type:', typeof error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      const errorMessage = error instanceof Error && error.message.includes('Network request failed')
        ? t('errors.networkError')
        : t('errors.analysisError');
      Alert.alert(t('common.error'), errorMessage);
    } finally {
      setIsAnalyzing(false);
      setElapsedTime(0);
    }
  };



  const searchWithKeywords = (keywords: string) => {
    const encoded = encodeURIComponent(keywords);
    Linking.openURL(`https://www.google.com/search?q=${encoded}`);
  };

  const handleShare = async () => {
    if (isSharing || !currentRecordId) return;
    
    const record = imageSourceHistory.find(r => r.id === currentRecordId);
    if (!record) {
      Alert.alert(t('common.error'), t('history.noImageSourceHistory'));
      return;
    }
    
    try {
      setIsSharing(true);
      
      if (!shareViewRef.current) {
        throw new Error('Share view not ready');
      }

      const uri = await captureRef(shareViewRef, {
        format: 'png',
        quality: 1,
      });

      const saved = await saveToGallery(uri);
      if (saved) {
        Alert.alert(t('common.success'), t('result.saveSuccess'));
      } else {
        Alert.alert(t('common.error'), t('result.saveFailed'));
      }
    } catch (error) {
      console.error('Failed to capture and save:', error);
      Alert.alert(t('common.error'), t('result.shareFailed'));
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          activeOpacity={0.6}
        >
          <ArrowLeft size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('home.findSource')}</Text>
        {analysis && currentRecordId ? (
          <TouchableOpacity
            onPress={handleShare}
            style={styles.shareButton}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            activeOpacity={0.6}
            disabled={isSharing}
          >
            {isSharing ? (
              <ActivityIndicator size="small" color="#0066FF" />
            ) : (
              <Share2 size={22} color="#0066FF" />
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {!selectedImage ? (
          <View style={styles.uploadSection}>
            <View style={styles.uploadIcon}>
              <Upload size={52} color="#fff" />
            </View>
            <Text style={styles.uploadTitle}>{t('imageSource.title')}</Text>
            <Text style={styles.uploadDescription}>
              {t('home.findSourceDesc')}
            </Text>

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => pickImage('camera')}
              >
                <Camera size={20} color="#fff" />
                <Text style={styles.uploadButtonText}>{t('upload.takePhoto')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={() => pickImage('library')}
              >
                <Upload size={20} color="#fff" />
                <Text style={styles.uploadButtonText}>{t('upload.uploadPhoto')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.imageContainer}>
              <Image source={{ uri: selectedImage }} style={styles.image} contentFit="contain" />
              <TouchableOpacity
                style={styles.changeImageButton}
                onPress={() => {
                  setSelectedImage(null);
                  setAnalysis(null);
                }}
              >
                <Text style={styles.changeImageText}>{t('verify.selectPhoto')}</Text>
              </TouchableOpacity>
              <Text style={styles.sourceHintText}>
                {t('imageSource.sourceHint')}
              </Text>
              <Text style={styles.recognitionNotice}>
                {t('imageSource.recognitionNotice')}
              </Text>
              <View style={styles.tipCard}>
                <Text style={styles.tipTitle}>{t('imageSource.tipTitle')}</Text>
                <Text style={styles.tipText}>{t('imageSource.tip1')}</Text>
                <Text style={styles.tipText}>{t('imageSource.tip2')}</Text>
                <Text style={styles.tipText}>{t('imageSource.tip3')}</Text>
              </View>
            </View>

            {!analysis && !isAnalyzing && (
              <TouchableOpacity style={styles.analyzeButton} onPress={analyzeImage}>
                <Search size={20} color="#fff" />
                <Text style={styles.analyzeButtonText}>{t('imageSource.clickToAnalyze')}</Text>
              </TouchableOpacity>
            )}

            {isAnalyzing && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0066FF" />
                <Text style={styles.loadingText}>{t('imageSource.analyzing')} {elapsedTime}{t('verify.seconds')}</Text>
              </View>
            )}

            {analysis && (
              <>
                {analysis.entityInfo && (analysis.entityInfo.name || analysis.entityInfo.introduction) && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                      {analysis.entityInfo.type === 'person' && t('imageSource.entityInfo')}
                      {analysis.entityInfo.type === 'animal' && t('imageSource.entityInfo')}
                      {analysis.entityInfo.type === 'plant' && t('imageSource.entityInfo')}
                      {analysis.entityInfo.type === 'other' && t('imageSource.entityInfo')}
                    </Text>
                    <View style={styles.entityCard}>
                      {analysis.entityInfo.name && (
                        <Text style={styles.entityName}>{analysis.entityInfo.name}</Text>
                      )}
                      {analysis.entityInfo.introduction && (
                        <Text style={styles.entityIntro}>{analysis.entityInfo.introduction}</Text>
                      )}
                    </View>
                  </View>
                )}

                {analysis.keywords.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('imageSource.keywords')}</Text>
                    <View style={styles.keywordsContainer}>
                      {analysis.keywords.map((keyword, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.keywordChip}
                          onPress={() => searchWithKeywords(keyword)}
                        >
                          <Text style={styles.keywordText}>{keyword}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <TouchableOpacity
                      style={styles.searchAllButton}
                      onPress={() => searchWithKeywords(analysis.keywords.join(' '))}
                    >
                      <Search size={16} color="#0066FF" />
                      <Text style={styles.searchAllText}>{t('home.lookupVerification')}</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {analysis.possibleSources.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('imageSource.keywords')}</Text>
                    <View style={styles.card}>
                      {analysis.possibleSources.map((source, index) => (
                        <View key={index} style={styles.sourceItem}>
                          <Text style={styles.sourceBullet}>•</Text>
                          <Text style={styles.sourceText}>{source}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.bottomBackButton}
                  onPress={() => router.back()}
                >
                  <ArrowLeft size={20} color="#0066FF" />
                  <Text style={styles.bottomBackText}>{t('common.back')}</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}
      </ScrollView>

      {currentRecordId && (() => {
        const record = imageSourceHistory.find(r => r.id === currentRecordId);
        if (!record) return null;
        return (
          <View style={styles.offscreenContainer}>
            <ShareableImageSourceResult
              ref={shareViewRef}
              record={record}
            />
          </View>
        );
      })()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0F172A',
  },
  placeholder: {
    width: 32,
  },
  shareButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  uploadSection: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  uploadIcon: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#0066FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  uploadTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
    letterSpacing: -0.5,
  },
  uploadDescription: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  buttonGroup: {
    width: '100%',
    gap: 12,
  },
  uploadButton: {
    flexDirection: 'row',
    backgroundColor: '#0066FF',
    paddingVertical: 18,
    paddingHorizontal: 36,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  uploadButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  image: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  changeImageButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  changeImageText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0066FF',
  },
  sourceHintText: {
    fontSize: 14,
    color: '#000',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
    fontWeight: '700',
  },
  recognitionNotice: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  tipCard: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#854D0E',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#A16207',
    marginBottom: 4,
    lineHeight: 20,
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0066FF',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 10,
    marginBottom: 24,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  analyzeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#64748B',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  descriptionText: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
  },
  keywordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  keywordChip: {
    backgroundColor: '#E6F0FF',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 24,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  keywordText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0066FF',
    letterSpacing: 0.2,
  },
  searchAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#0066FF',
  },
  searchAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066FF',
  },
  sourceItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  sourceBullet: {
    fontSize: 15,
    color: '#0066FF',
    marginRight: 8,
    fontWeight: '700',
  },
  sourceText: {
    flex: 1,
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
  },
  searchEngines: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  engineButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  engineName: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  suggestionsCard: {
    flexDirection: 'row',
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#0066FF',
  },
  suggestionIcon: {
    marginTop: 2,
  },
  suggestionContent: {
    flex: 1,
    marginLeft: 12,
  },
  suggestionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 6,
  },
  suggestionText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  entityCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 5,
    borderLeftColor: '#0066FF',
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  entityName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  entityIntro: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
  },
  bottomBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#0066FF',
  },
  bottomBackText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066FF',
  },
  offscreenContainer: {
    position: 'absolute',
    left: Platform.OS === 'web' ? 0 : -9999,
    top: Platform.OS === 'web' ? 0 : -9999,
    opacity: Platform.OS === 'web' ? 0 : 1,
    zIndex: -1,
  },
});
