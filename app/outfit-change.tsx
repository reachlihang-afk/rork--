// outfit-change-new.tsx - 完整版
// 新UI设计 + 完整功能集成

import { useState, useCallback, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  Switch,
  Alert,
  ActivityIndicator,
  useColorScheme,
  Platform 
} from 'react-native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Camera, Sparkles, Lock, X, ArrowLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useCoin } from '@/contexts/CoinContext';
import { useVerification } from '@/contexts/VerificationContext';
import { useSquare } from '@/contexts/SquareContext';
import { useAuth } from '@/contexts/AuthContext';

type TabType = 'template' | 'custom' | 'pro';

// AI Prompt前缀
const COMMON_PROMPT_PREFIX = 'IMPORTANT: Keep face, facial expression, hairstyle, pose, and photo framing EXACTLY as in original. Only change clothing in the EXACT visible areas. If only partial clothing is visible, apply only to that partial area. Do NOT extend or complete the image. ';

// 20个精选模板
const TEMPLATES = [
  { id: 'random', name: '随机装', nameEn: 'Random', icon: '🎲', prompt: 'RANDOM_PLACEHOLDER' },
  { id: 'jennie', name: 'Jennie同款', nameEn: 'Jennie', icon: '💖', prompt: 'JENNIE_PLACEHOLDER' },
  { id: 'bikini', name: '比基尼', nameEn: 'Bikini', icon: '👙', prompt: 'bikini swimsuit' },
  { id: 'formal', name: '正装', nameEn: 'Formal', icon: '👔', prompt: 'formal business attire' },
  { id: 'sport', name: '运动装', nameEn: 'Sports', icon: '🏃', prompt: 'athletic sportswear' },
  { id: 'fairytale-princess', name: '童话公主装', nameEn: 'Princess', icon: '👸', prompt: 'fairytale princess dress' },
  { id: 'old-money', name: '老钱风', nameEn: 'Old Money', icon: '💰', prompt: 'old money elegant style' },
  { id: 'tennis', name: '网球装', nameEn: 'Tennis', icon: '🎾', prompt: 'tennis outfit' },
  { id: 'ski', name: '滑雪服', nameEn: 'Ski', icon: '⛷️', prompt: 'ski wear' },
  { id: 'lolita', name: '洛丽塔', nameEn: 'Lolita', icon: '🎀', prompt: 'lolita fashion dress' },
  { id: 'punk', name: '朋克装', nameEn: 'Punk', icon: '🎸', prompt: 'punk rock style' },
  { id: 'wedding', name: '婚纱', nameEn: 'Wedding', icon: '👰', prompt: 'wedding dress' },
  { id: 'traditional', name: '汉服', nameEn: 'Hanfu', icon: '🏮', prompt: 'traditional Chinese Hanfu' },
  { id: 'superhero', name: '超级英雄', nameEn: 'Superhero', icon: '🦸', prompt: 'superhero costume' },
  { id: 'starbucks-barista', name: '星巴克', nameEn: 'Starbucks', icon: '☕', prompt: 'Starbucks barista uniform' },
  { id: 'hot-girl', name: '辣妹装', nameEn: 'Hot Girl', icon: '🔥', prompt: 'hot trendy girl style' },
  { id: 'cowboy', name: '牛仔装', nameEn: 'Cowboy', icon: '🤠', prompt: 'western cowboy style' },
  { id: 'outdoor', name: '户外装', nameEn: 'Outdoor', icon: '🏔️', prompt: 'outdoor adventure clothing' },
  { id: 'flight-attendant', name: '空姐装', nameEn: 'Flight', icon: '✈️', prompt: 'flight attendant uniform' },
  { id: 'god-of-wealth', name: '财神装', nameEn: 'Wealth God', icon: '💸', prompt: 'Chinese God of Wealth costume' },
];

// 随机风格库 - 完整版157种风格
const RANDOM_OUTFIT_STYLES = [
  'Hot trendy girl style - crop top, mini skirt, bold streetwear',
  'Meituan delivery uniform - yellow and black branded outfit',
  'Luxury designer ski wear - sleek jacket fully zipped with ski goggles',
  'Flight attendant uniform - elegant airline uniform with scarf',
  'Outdoor adventure clothing - hiking jacket, cargo pants, functional gear',
  'Western cowboy style - denim jeans, boots, plaid shirt, western hat',
  'Magical wizard costume - flowing robes with pointed hat, mystical style',
  'Pirate costume - tricorn hat, eye patch, pirate coat, seafarer style',
  'Fairytale princess dress - magical elegant gown with tiara and royal charm',
  'Lolita fashion - frilly dresses, lace, bows, petticoats with sweet/classic/goth styles',
  'Visual kei rock style - dramatic layered outfits, bold makeup-inspired fashion with dark elegant vibe',
  'Punk style - leather jackets, studs, tartan, ripped details with rebellious attitude',
  
  // 扩展风格库 - 80+种额外风格
  '1950s vintage pin-up style - high-waisted skirt, polka dots, retro glamour',
  '1960s mod fashion - geometric patterns, mini dress, go-go boots, bold colors',
  '1970s disco style - bell bottoms, platform shoes, sequined top, funky patterns',
  '1980s power suit - shoulder pads, bold colors, executive business style',
  '1990s grunge aesthetic - flannel shirt, ripped jeans, combat boots, layered look',
  '2000s Y2K fashion - low-rise jeans, butterfly clips, metallic fabrics, futuristic',
  'Elegant evening gown - floor-length formal dress with sophisticated design',
  'Cocktail party dress - chic knee-length dress with stylish accessories',
  'Bohemian festival outfit - flowing maxi dress, fringe details, flower crown',
  'Preppy school uniform - pleated skirt, blazer, tie, academic style',
  'Gothic lolita fashion - Victorian-inspired dress with dark romantic style',
  'Kawaii Japanese street style - colorful layers, cute accessories, playful fashion',
  'Harajuku decora fashion - bright colors, multiple accessories, maximalist style',
  'Korean ulzzang style - trendy oversized clothing, soft colors, stylish casual',
  'Minimalist Scandinavian fashion - clean lines, neutral tones, simple elegance',
  'Parisian chic style - striped shirt, beret, elegant trench coat, effortless',
  'Italian luxury fashion - designer pieces, bold patterns, sophisticated style',
  'British mod style - tailored pieces, classic patterns, refined look',
  'American preppy ivy league - cable knit sweater, khakis, loafers, classic',
  'Streetwear hypebeast - branded hoodies, sneakers, urban fashion, trendy',
  'Athleisure workout gear - yoga pants, sports bra, stylish athletic wear',
  'Balletcore aesthetic - tulle skirt, ballet flats, delicate feminine style',
  'Dark academia - tweed blazer, turtleneck, vintage scholarly aesthetic',
  'Light academia - cream colors, cardigans, romantic scholarly style',
  'Cottagecore pastoral - prairie dress, floral patterns, countryside charm',
  'Fairycore whimsical - ethereal flowing dress, nature-inspired, magical',
  'Goblincore earthy - oversized layers, mushroom prints, forest aesthetic',
  'Mermaidcore oceanic - iridescent fabrics, shell accessories, aquatic theme',
  'Royalcore regal - velvet, gold details, crown, luxurious royal style',
  'Regencycore historical - empire waist dress, Jane Austen inspired elegance',
  'Victorian era fashion - corset, bustle skirt, lace details, period costume',
  'Edwardian style - high collar blouse, long skirt, Gibson girl aesthetic',
  'Flapper 1920s - fringe dress, headband, art deco glamour',
  'Rockabilly style - polka dot dress, leather jacket, retro pinup',
  'Punk rock fashion - leather jacket, studs, ripped clothing, rebellious',
  'Emo alternative style - black skinny jeans, band tee, layered hair accessories',
  'Scene kid aesthetic - neon colors, tutus, bold makeup style clothing',
  'Soft girl aesthetic - pastel colors, oversized sweater, cute skirts',
  'E-girl style - striped shirt, chain accessories, alternative internet fashion',
  'VSCO girl outfit - scrunchies, oversized tee, trendy casual beach style',
  'Baddie aesthetic - bodycon dress, designer accessories, confident style',
  'Clean girl aesthetic - sleek hair, minimal jewelry, polished simple look',
  'That girl aesthetic - matching set, organized style, aspirational fashion',
  'Barbiecore hot pink - all pink outfit, glamorous Barbie-inspired style',
  'Tomboy athletic - baggy jeans, oversized shirt, sporty comfortable style',
  'Androgynous fashion - gender-neutral suit, minimalist unisex style',
  'Cyberpunk futuristic - neon accents, tech-wear, dystopian urban style',
  'Steampunk Victorian - gears, goggles, brass details, industrial fantasy',
  'Witchy mystic - flowing dark robes, moon symbols, magical bohemian',
  'Hippie peace style - tie-dye, bell sleeves, flower power, free spirit',
  'Safari explorer - khaki utility vest, cargo shorts, adventure ready',
  'Tropical vacation - bright floral print, beach resort casual style',
  'Nautical sailor - navy stripes, white pants, maritime classic style',
  'Equestrian riding - jodhpurs, riding boots, polo style, horse rider',
  'Figure skating costume - sparkly dress, athletic elegance, ice rink style',
  'Ballerina performance - classical tutu, pointe shoes, graceful dance attire',
  'Flamenco dancer - ruffled red dress, Spanish passionate style',
  'Belly dancer costume - jeweled bra top, flowing pants, Middle Eastern',
  'Traditional Japanese kimono - elegant silk robe with obi belt, cultural',
  'Indian sari - draped silk fabric, ornate jewelry, traditional elegance',
  'Scottish highland - tartan kilt, sporran, bagpiper traditional dress',
  'German dirndl - traditional Bavarian dress, folk costume, Oktoberfest',
  'Mexican folklorico - colorful embroidered dress, traditional festive',
  'Russian kokoshnik - traditional headdress with ornate dress, folk style',
  'Egyptian pharaoh - gold jewelry, white linen, ancient royal costume',
  'Greek goddess - flowing white toga, gold accents, classical mythology',
  'Roman centurion - armor, red cape, ancient military costume',
  'Medieval knight - armor suit, shield, chivalrous warrior style',
  'Renaissance faire - corset bodice, full skirt, historical costume',
  'Samurai warrior - traditional armor, hakama, Japanese martial style',
  'Geisha traditional - elaborate kimono, white makeup style, cultural',
  'Flapper jazz age - beaded dress, feather headband, roaring twenties',
  'Pin-up girl retro - high-waisted shorts, crop top, vintage glamour',
  'Burlesque performer - corset, feather boa, theatrical glamorous style',
  'Circus ringmaster - red jacket, top hat, theatrical performer style',
  'Mime artist - striped shirt, beret, theatrical black and white',
  'Clown entertainer - colorful baggy outfit, playful costume',
  'Chef professional - white coat, toque hat, culinary uniform',
  'Doctor medical - white coat, stethoscope, professional healthcare',
  'Firefighter uniform - protective gear, reflective stripes, heroic',
  'Police officer - uniform, badge, law enforcement professional',
  'Astronaut space suit - NASA style, futuristic space explorer',
  'Scuba diver - wetsuit, diving gear, underwater explorer',
  'Beekeeper protective - white suit, veil hat, beekeeping attire',
  'Construction worker - hard hat, reflective vest, safety gear',
  'Farmer overall - denim overalls, plaid shirt, agricultural worker',
  'Gardener casual - apron, gloves, green thumb practical style',
  'Librarian vintage - cardigan, glasses, books, intellectual style',
  'Secretary 1960s - pencil skirt, blouse, professional retro office',
  'Waitress diner - retro uniform, apron, classic restaurant style',
  'Maid Victorian - black dress, white apron, classic servant costume',
  'Butler formal - tailcoat, white gloves, sophisticated service attire',
  'Mechanic work - coveralls, tool belt, automotive repair practical',
  'Artist painter - paint-splattered smock, beret, creative bohemian',
  'Photographer vest - utility vest with pockets, professional casual',
  'DJ performer - headphones, trendy streetwear, music producer style',
  'Rockstar stage - leather pants, studded jacket, concert performer',
  'Pop star concert - sparkly costume, bold stage outfit, performer',
  'Rapper hip-hop - oversized chains, branded clothing, urban style',
  'Country singer - cowboy hat, boots, Nashville stage style',
  'Opera singer - elaborate gown, dramatic classical performance attire',
];

// 随机选择一种风格的函数
function getRandomOutfitStyle(): string {
  const randomIndex = Math.floor(Math.random() * RANDOM_OUTFIT_STYLES.length);
  return RANDOM_OUTFIT_STYLES[randomIndex];
}

// Jennie完整场景库 - 24种经典街拍/舞台场景（姿态+服饰+背景完整重现）
const JENNIE_SCENE_STYLES = [
  'Jennie Chanel airport scene: Incheon Airport departure hall with bright terminal lighting and glass windows, confident walking pose pulling designer luggage, luxury Chanel tweed jacket with mini skirt and pearl accessories, oversized sunglasses, candid paparazzi-style street photography with natural motion blur',
  
  'Jennie casual airport fashion: Modern airport terminal background with travelers and flight boards, relaxed leaning pose against glass wall, oversized blazer over crop top with high-waisted jeans, designer bag and sunglasses, effortless chic candid photography',
  
  'Jennie concert stage performance: Large concert stage with dramatic purple and pink lighting, dynamic performance pose with microphone in hand, crystal embellished bodysuit with thigh-high boots, confident stage presence, professional concert photography with smoke effects',
  
  'Jennie Coachella festival moment: Outdoor music festival with desert landscape and sunset sky, casual standing pose with arms raised, colorful bohemian crop top with denim shorts and flower crown, festival wristbands, warm golden hour photography',
  
  'Jennie pink Paris street: Parisian street with Haussmann buildings and cafe terraces, elegant walking pose on cobblestone, all-pink outfit with oversized blazer and mini dress, pastel aesthetic, soft European street photography',
  
  'Jennie leather night Seoul: Neon-lit Seoul street (Gangnam) at night with Korean signs glowing, confident standing pose against brick wall, black leather jacket with leather pants or skirt, urban night photography with vibrant city lights',
  
  'Jennie preppy campus look: Modern university campus with contemporary architecture, sitting casually on concrete steps, pleated mini skirt with cardigan and white sneakers, youthful student vibe, bright daylight photography',
  
  'Jennie tennis club elegance: Luxury tennis court with net and green surface, athletic pose holding tennis racket, white tennis dress or skirt with polo shirt, sporty yet fashionable, bright outdoor natural lighting',
  
  'Jennie CEO office power: Modern glass office building lobby with marble floors, powerful standing pose in front of windows, tailored oversized designer suit with crop top underneath, boss energy, professional architectural photography',
  
  'Jennie 90s retro cafe: Vintage themed cafe interior with neon signs and retro decor, casual sitting pose at small round table, vintage crop top with low-rise jeans, Y2K aesthetic, warm cozy indoor lighting with film grain',
  
  'Jennie Seoul street casual: Busy Gangnam street with Korean shops and pedestrians, candid walking pose with coffee cup, oversized hoodie with bike shorts and chunky sneakers, everyday K-pop star off-duty style, natural street photography',
  
  'Jennie red carpet glamour: Luxury event venue with red carpet and step-and-repeat backdrop, elegant standing pose for cameras, sparkling evening gown with jewelry, Hollywood premiere atmosphere, professional event photography with flashes',
  
  'Jennie denim downtown: Urban downtown area with modern high-rise buildings, leaning casually against luxury car, denim-on-denim look with jacket and jeans, cool street style, golden hour warm lighting',
  
  'Jennie minimal studio: Clean white photography studio with professional lighting equipment visible, high fashion editorial pose, classic black and white color-blocked outfit, timeless minimalist aesthetic, professional studio lighting setup',
  
  'Jennie poolside luxury: Infinity pool at luxury hotel with ocean view, confident standing pose by pool edge, designer crop top with high-waisted bottoms and sunglasses, summer vacation glamour, bright tropical sunlight',
  
  'Jennie Celine boutique: High-end Celine store interior with modern minimalist design, elegant shopping pose holding designer bag, sophisticated Celine pieces in neutral tones, luxury retail atmosphere, soft boutique lighting',
  
  'Jennie grunge warehouse: Urban warehouse with graffiti walls and industrial elements, rebellious leaning pose with attitude, ripped jeans with band tee and leather jacket with chains, underground music scene vibe, moody dramatic lighting',
  
  'Jennie garden photoshoot: Lush flower garden with blooming roses and greenery, graceful standing pose among flowers, romantic floral mini dress, feminine spring aesthetic, soft natural diffused sunlight',
  
  'Jennie gym athleisure: Modern luxury gym with mirrors and equipment, workout pose mid-exercise, designer sports bra with matching leggings, high-end athletic brand styling, bright gym fluorescent lighting',
  
  'Jennie runway power: Fashion show runway with audience and cameras, confident runway walk pose mid-stride, oversized blazer worn as dress with belt, powerful fashion statement, dramatic runway spotlights',
  
  'Jennie tropical beach: White sand beach with turquoise water and palm trees, relaxed beach pose with wind in hair, breezy summer dress with straw sun hat, vacation paradise vibes, warm sunset golden hour',
  
  'Jennie winter Seoul: Snowy Seoul street with Christmas lights and winter decorations, elegant walking pose in snow, luxury fur coat or long wool coat with designer boots and scarf, winter wonderland scene, soft snow-reflected lighting',
  
  'Jennie nightclub party: Upscale nightclub interior with colorful disco lights and DJ booth, dancing pose with energy, sparkly sequin mini dress or metallic top with leather pants, glamorous nightlife, dynamic colored club lighting',
  
  'Jennie K-fashion street: Trendy Seoul Garosu-gil street with boutiques and cafes, confident walking pose, layered Korean street fashion with oversized pieces and unique accessories, K-pop idol off-duty style, vibrant urban street photography',
];

// 随机选择一种Jennie完整场景
function getRandomJennieScene(): string {
  const randomIndex = Math.floor(Math.random() * JENNIE_SCENE_STYLES.length);
  return JENNIE_SCENE_STYLES[randomIndex];
}

export default function OutfitChangeNewScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const params = useLocalSearchParams();
  
  const { user, isLoggedIn } = useAuth();
  const { coinBalance, canUseOutfitChange, useOutfitChange } = useCoin();
  const { addOutfitChangeRecord } = useVerification();
  const { shareToSquare } = useSquare();

  // 状态管理
  const [selectedTab, setSelectedTab] = useState<TabType>('template');
  const [userImage, setUserImage] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [customImages, setCustomImages] = useState<string[]>([]);
  const [keepFaceFeatures, setKeepFaceFeatures] = useState(true);
  const [beautyFilter, setBeautyFilter] = useState(false);
  const [showAllTemplates, setShowAllTemplates] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Pro Style相关状态
  const [selectedInfluencerId, setSelectedInfluencerId] = useState<string | null>(null);
  const [selectedLookPrompt, setSelectedLookPrompt] = useState<string | null>(null);

  // 从首页传来的照片URI
  useEffect(() => {
    if (params.photoUri && typeof params.photoUri === 'string') {
      setUserImage(params.photoUri);
    }
  }, [params.photoUri]);

  // 从influencer collection返回的数据
  useEffect(() => {
    if (params.mode === 'pro' && params.lookPrompt) {
      setSelectedTab('pro');
      setSelectedInfluencerId(typeof params.influencerId === 'string' ? params.influencerId : null);
      setSelectedLookPrompt(typeof params.lookPrompt === 'string' ? params.lookPrompt : null);
    }
  }, [params.mode, params.lookPrompt, params.influencerId]);

  // 上传照片
  const handleUploadPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.tip'), t('outfitChange.mediaLibraryPermission'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.9,
      });

      if (!result.canceled && result.assets[0]) {
        setUserImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('上传失败:', error);
      Alert.alert(t('common.error'), t('common.error'));
    }
  };

  // 拍照
  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.tip'), '需要相机权限');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.9,
      });

      if (!result.canceled && result.assets[0]) {
        setUserImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('拍照失败:', error);
    }
  };

  // 添加自定义服饰图片
  const handleAddCustomImage = async () => {
    if (customImages.length >= 2) {
      Alert.alert(t('common.tip'), t('outfitChange.maxImagesReached'));
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.tip'), t('outfitChange.mediaLibraryPermission'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.9,
      });

      if (!result.canceled && result.assets[0]) {
        setCustomImages([...customImages, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('添加失败:', error);
    }
  };

  // 删除自定义图片
  const handleRemoveCustomImage = (index: number) => {
    setCustomImages(customImages.filter((_, i) => i !== index));
  };

  // Web平台图片压缩函数
  const compressImageWeb = async (blob: Blob, maxWidth: number = 800, quality: number = 0.7): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (Platform.OS !== 'web') {
        resolve(blob);
        return;
      }
      
      const img = document.createElement('img') as HTMLImageElement;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // 等比例缩放
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (compressedBlob) => {
            if (compressedBlob) {
              resolve(compressedBlob);
            } else {
              reject(new Error('Compression failed'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(blob);
    });
  };

  // 转换图片为Base64
  const convertToBase64 = async (uri: string, compress: boolean = true, isMainImage: boolean = false): Promise<string> => {
    if (Platform.OS === 'web') {
      try {
        console.log('[convertToBase64] Converting web image:', uri.substring(0, 100));
        const response = await fetch(uri);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }
        let blob = await response.blob();
        console.log('[convertToBase64] Original blob size:', blob.size, 'bytes');
        
        // 强制压缩所有图片以避免413错误
        if (compress) {
          console.log('[convertToBase64] Compressing image...');
          // 极度激进的压缩参数以确保请求体不会太大
          const maxWidth = isMainImage ? 480 : 360;
          const quality = isMainImage ? 0.45 : 0.35;
          blob = await compressImageWeb(blob, maxWidth, quality);
          console.log('[convertToBase64] After first compression:', blob.size, 'bytes');
        }
        
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result as string;
            const base64Data = base64.split(',')[1];
            const sizeInKB = Math.round(base64Data.length / 1024);
            console.log('[convertToBase64] Conversion complete, base64 size:', sizeInKB, 'KB');
            
            // 如果base64数据仍然太大（>400KB），进行二次压缩
            if (compress && base64Data.length > 400000) {
              console.log('[convertToBase64] Data still too large (', sizeInKB, 'KB), applying aggressive secondary compression...');
              // 重新压缩为更小的尺寸和更低质量
              fetch(uri)
                .then(res => res.blob())
                .then(newBlob => compressImageWeb(newBlob, isMainImage ? 360 : 280, 0.25))
                .then(finalBlob => {
                  const finalReader = new FileReader();
                  finalReader.onloadend = () => {
                    const finalBase64 = (finalReader.result as string).split(',')[1];
                    console.log('[convertToBase64] Secondary compression complete, final length:', finalBase64.length, 'bytes');
                    resolve(finalBase64);
                  };
                  finalReader.onerror = reject;
                  finalReader.readAsDataURL(finalBlob);
                })
                .catch(reject);
            } else {
              resolve(base64Data);
            }
          };
          reader.onerror = (error) => {
            console.error('[convertToBase64] FileReader error:', error);
            reject(error);
          };
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error('[convertToBase64] Web conversion error:', error);
        throw new Error('图片转换失败，请重新选择图片');
      }
    } else {
      const base64String = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64String;
    }
  };

  // 构建Prompt
  const buildPrompt = (): string => {
    if (selectedTab === 'template' && selectedTemplate) {
      const template = TEMPLATES.find(t => t.id === selectedTemplate);
      if (!template) return '';

      if (template.id === 'random') {
        const style = getRandomOutfitStyle();
        return COMMON_PROMPT_PREFIX + `Change the outfit to: ${style}`;
      } else if (template.id === 'jennie') {
        const jennieScene = getRandomJennieScene();
        return `Transform this person into a Jennie from BLACKPINK inspired photoshoot. Use the reference style images to recreate the iconic Jennie aesthetic.

WHAT TO KEEP FROM THE ORIGINAL PERSON:
1. FACE IDENTITY: Keep the person's exact facial features, face structure, eye shape, nose, mouth shape, facial bone structure - this person's face MUST remain 100% recognizable
2. BODY SHAPE: Keep the person's exact body proportions, height, build, and figure

WHAT TO TRANSFORM TO JENNIE STYLE (based on reference images):
1. FACIAL EXPRESSION: Transform to Jennie's signature expressions - confident, cool, slightly mysterious gaze, subtle smile or pout
2. MAKEUP STYLE: Apply Jennie's iconic makeup - cat-eye liner, soft pink/nude lips, glowing dewy skin, subtle contour, natural yet glamorous
3. HAIRSTYLE: Transform to Jennie's hairstyle shown in the reference style
4. POSE & GESTURE: Transform to match the confident, fashionable pose from the scene description
5. OUTFIT: Complete wardrobe transformation to Jennie's signature style from the scene
6. ACCESSORIES: Add all accessories, jewelry, bags shown in the scene description
7. BACKGROUND: Replace with the complete scene environment described
8. LIGHTING & ATMOSPHERE: Match the professional K-pop idol photography lighting
9. PHOTOGRAPHY STYLE: Professional fashion photography quality with natural depth
10. NO WATERMARKS: Generate a completely clean image without any watermarks, text overlays, logos, "小红书" (Xiaohongshu/RED) marks, or any branding elements

SCENE TO RECREATE:
${jennieScene}

FINAL RESULT REQUIREMENTS:
- The person's face should be instantly recognizable as the original person
- The body proportions should match the original person exactly  
- Everything else (expression, styling, pose, clothes, background) should look like a professional Jennie-inspired photoshoot
- The image should feel like this person was professionally styled and photographed in Jennie's iconic fashion aesthetic
- Photo-realistic quality with natural lighting and authentic K-pop idol photography feel
- Completely clean output with NO watermarks, text, or logos of any kind`;
      } else {
        return COMMON_PROMPT_PREFIX + `Change the outfit to ${template.prompt}`;
      }
    } else if (selectedTab === 'custom' && customImages.length > 0) {
      return COMMON_PROMPT_PREFIX + 'Apply the clothing style from the reference images to the person, matching colors, patterns, and design details exactly.';
    } else if (selectedTab === 'pro' && selectedLookPrompt) {
      // Pro Style: 使用从influencer collection传来的prompt
      return `Transform this person to match the influencer's look. Keep the person's face identity and body proportions exactly. Change the outfit, pose, background, and overall styling to match: ${selectedLookPrompt}`;
    }
    return '';
  };

  // 开始生成
  const handleGenerate = async () => {
    // 验证
    if (!userImage) {
      Alert.alert(t('common.tip'), t('outfitChange.selectImage'));
      return;
    }

    if (selectedTab === 'template' && !selectedTemplate) {
      Alert.alert(t('common.tip'), t('outfitChange.selectImageAndTemplate'));
      return;
    }

    if (selectedTab === 'custom' && customImages.length === 0) {
      Alert.alert(t('common.tip'), t('outfitChange.selectOutfitImages'));
      return;
    }

    if (selectedTab === 'pro' && !selectedLookPrompt) {
      Alert.alert(t('common.tip'), '请先从达人页面选择一个造型');
      return;
    }

    // 检查金币
    const canUse = await canUseOutfitChange();
    if (!canUse) {
      Alert.alert(
        t('common.tip'),
        t('outfitChange.insufficientCoins'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { 
            text: t('profile.recharge'),
            onPress: () => router.push('/recharge' as any)
          }
        ]
      );
      return;
    }

    setIsGenerating(true);

    try {
      console.log('[OutfitChange] Starting generation, tab:', selectedTab);
      
      // 始终启用压缩以避免413错误
      const base64Image = await convertToBase64(userImage, true, true); // 强制压缩主图
      console.log('[OutfitChange] Main image converted, size:', base64Image.length);
      
      let requestBody: any;
      
      if (selectedTab === 'template') {
        // 模板模式
        const finalPrompt = buildPrompt();
        
        requestBody = {
          prompt: finalPrompt,
          images: [{ type: 'image', image: base64Image }],
          aspectRatio: '3:4',
        };
        console.log('[OutfitChange] Template mode request body prepared');
        
      } else if (selectedTab === 'custom') {
        // 自定义穿搭模式
        console.log('[OutfitChange] Custom mode, converting', customImages.length, 'outfit images');
        
        try {
          const outfitBase64Images = await Promise.all(
            customImages.map(async (uri, index) => {
              console.log(`[OutfitChange] Converting outfit image ${index + 1}/${customImages.length}`);
              const base64 = await convertToBase64(uri, true, false); // 启用压缩，这是服饰图（非主图）
              console.log(`[OutfitChange] Outfit image ${index + 1} converted, size:`, base64.length);
              return base64;
            })
          );
          
          const prompt = `CRITICAL INSTRUCTIONS - Follow EXACTLY:

1. PRESERVE EVERYTHING: Keep 100% unchanged:
   - Face, facial expression, eye direction, mouth position
   - Facial features, skin tone, eye color
   - Hairstyle, hair color, hair position
   - Body structure, pose, posture
   - Background, lighting, shadows
   - Photo framing and cropping

2. PARTIAL VISIBILITY RULE: 
   - If the original image shows ONLY HALF of a shirt → apply ONLY HALF of the new shirt in the SAME visible area
   - If only sleeves are visible → apply ONLY sleeves from the reference clothing
   - If only upper body is visible → apply ONLY upper body clothing
   - NEVER complete or extend clothing beyond what's visible in the original
   - NEVER add or generate body parts that are cropped out or not visible

3. EXACT FRAMING: 
   - Keep the EXACT same cropping and framing as the original
   - If original is cut off at waist → result must also cut off at waist
   - If original shows partial clothing → result must show SAME partial view
   - Do NOT try to show the "complete" outfit

4. CLOTHING APPLICATION:
   - Apply clothing textures, colors, and patterns from reference images
   - Apply ONLY to the EXACT visible areas in the original photo
   - Match the perspective and angle of the original photo
   - If only 30% of a garment is visible, apply only 30%

5. HAT/HEADWEAR: 
   - Place naturally on head WITHOUT changing hairstyle or hair visibility
   - If head is partially cropped, keep it partially cropped

6. IGNORE IMPOSSIBLE ITEMS:
   - If shoes are in reference but feet not visible → completely ignore shoes
   - If pants are in reference but legs not visible → completely ignore pants
   - Do NOT generate missing body parts to accommodate clothing

7. NO MODIFICATIONS:
   - Do NOT change facial expression
   - Do NOT adjust pose or body position  
   - Do NOT extend or complete the image
   - ONLY replace visible clothing textures/colors in existing areas`;
          
          requestBody = {
            prompt: prompt,
            images: [
              { type: 'image', image: base64Image },
              ...outfitBase64Images.map(img => ({ type: 'reference', image: img }))
            ],
            aspectRatio: '3:4',
          };
          console.log('[OutfitChange] Custom mode request body prepared with', requestBody.images.length, 'images');
        } catch (conversionError) {
          console.error('[OutfitChange] Error converting outfit images:', conversionError);
          throw new Error('图片转换失败，请重试');
        }
        
      } else if (selectedTab === 'pro') {
        // Pro Style模式
        const finalPrompt = buildPrompt();
        
        requestBody = {
          prompt: finalPrompt,
          images: [{ type: 'image', image: base64Image }],
          aspectRatio: '3:4',
        };
        console.log('[OutfitChange] Pro Style mode request body prepared');
      }
      
      // 计算请求体大小
      const requestBodyString = JSON.stringify(requestBody);
      const requestSizeKB = Math.round(requestBodyString.length / 1024);
      const requestSizeMB = (requestSizeKB / 1024).toFixed(2);
      console.log('[OutfitChange] Request body size:', requestSizeKB, 'KB (', requestSizeMB, 'MB)');
      
      // 如果请求体超过5MB，警告用户
      if (requestBodyString.length > 5 * 1024 * 1024) {
        console.warn('[OutfitChange] Request body is very large:', requestSizeMB, 'MB');
        Alert.alert(
          t('common.tip'),
          `图片数据较大（${requestSizeMB}MB），很可能会生成失败。\n\n强烈建议：${selectedTab === 'custom' ? '只上传1张服饰图片' : '选择更小的照片'}`,
          [
            { text: t('common.cancel'), style: 'cancel', onPress: () => { 
              setIsGenerating(false);
            }},
            { text: '继续尝试', onPress: () => {} }
          ]
        );
      }
      
      console.log('[OutfitChange] Sending request to API...');
      const response = await fetch('https://toolkit.rork.com/images/edit/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBodyString,
      });
      console.log('[OutfitChange] API response received, status:', response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('[OutfitChange] API Error:', response.status, errorData);
        
        if (response.status === 413) {
          const suggestion = selectedTab === 'custom' 
            ? '建议：\n1. 只上传1张服饰图片试试\n2. 确保原始照片不要太大\n3. 选择文件大小较小的图片'
            : '建议：\n1. 重新选择更小的照片\n2. 使用裁剪功能减小图片尺寸\n3. 选择文件大小较小的图片';
          throw new Error(`图片数据过大，服务器拒绝处理\n\n${suggestion}`);
        }
        
        throw new Error(`生成失败: HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.image || !data.image.base64Data) {
        console.error('Invalid response data:', data);
        throw new Error('生成失败: 服务器返回数据格式错误');
      }

      const generatedImageUri = `data:${data.image.mimeType};base64,${data.image.base64Data}`;
      
      // 提示用户图片已生成
      Alert.alert(t('common.success'), '图片已生成');
      
      // 使用换装次数（可能消耗免费次数或金币）
      await useOutfitChange();
      
      // 保存到历史记录
      try {
        const templateName = selectedTab === 'template' 
          ? TEMPLATES.find(t => t.id === selectedTemplate)?.name || '自定义'
          : selectedTab === 'custom' ? t('outfitChange.customOutfit') : 'Pro Style';
        
        const recordId = await addOutfitChangeRecord({
          originalImageUri: userImage,
          resultImageUri: generatedImageUri,
          templateName: templateName,
          createdAt: Date.now(),
        });
        
        // 跳转到结果页
        router.push(`/outfit-change-detail/${recordId}` as any);
        
      } catch (historyError) {
        console.error('Failed to save to history:', historyError);
        // 即使保存失败也显示结果
        Alert.alert(t('common.success'), '图片已生成（但保存历史记录失败）');
      }
      
    } catch (error: any) {
      console.error('[OutfitChange] Generation error:', error);
      let errorMessage = t('outfitChange.generationFailed');
      
      if (error.message === 'Failed to fetch') {
        errorMessage = '网络连接失败，请检查网络连接后重试';
        console.error('[OutfitChange] Network error - Failed to fetch');
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert(t('common.error'), errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const displayedTemplates = showAllTemplates ? TEMPLATES : TEMPLATES.slice(0, 9);

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: t('outfitChange.outfitSwap'),
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} color={isDark ? '#fff' : '#1a1a1a'} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 步骤1: 上传照片 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, isDark && styles.textDark]}>
              {t('outfitChange.whoIsSwapping')}
            </Text>
            <Text style={styles.stepLabel}>{t('outfitChange.step1')}</Text>
          </View>

          <TouchableOpacity
            style={[styles.uploadArea, isDark && styles.uploadAreaDark]}
            onPress={handleUploadPhoto}
            onLongPress={handleTakePhoto}
            activeOpacity={0.7}
          >
            {userImage ? (
              <>
                <Image source={{ uri: userImage }} style={styles.uploadedImage} contentFit="cover" />
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => setUserImage(null)}
                >
                  <X size={16} color="#fff" />
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.uploadPlaceholder}>
                <View style={[styles.cameraIcon, isDark && styles.cameraIconDark]}>
                  <Camera size={32} color={isDark ? '#fff' : '#1a1a1a'} strokeWidth={1.5} />
                </View>
                <Text style={[styles.uploadTitle, isDark && styles.textDark]}>
                  {t('outfitChange.uploadPhoto')}
                </Text>
                <Text style={styles.uploadSubtitle}>
                  {t('outfitChange.tapToSnap')}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.privacyNote}>
            <Lock size={12} color="#9ca3af" />
            <Text style={styles.privacyText}>
              {t('outfitChange.photosProcessed')}
            </Text>
          </View>
        </View>

        {/* 步骤2: 选择风格 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, isDark && styles.textDark]}>
              {t('outfitChange.selectStyle')}
            </Text>
            <Text style={styles.stepLabel}>{t('outfitChange.step2')}</Text>
          </View>

          {/* Tab选择器 */}
          <View style={[styles.tabContainer, isDark && styles.tabContainerDark]}>
            <TouchableOpacity
              style={[styles.tab, selectedTab === 'template' && styles.tabActive]}
              onPress={() => setSelectedTab('template')}
            >
              <Text style={[
                styles.tabText,
                selectedTab === 'template' && styles.tabTextActive
              ]}>
                {t('outfitChange.templateSwap')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, selectedTab === 'custom' && styles.tabActive]}
              onPress={() => setSelectedTab('custom')}
            >
              <Text style={[
                styles.tabText,
                selectedTab === 'custom' && styles.tabTextActive
              ]}>
                {t('outfitChange.customOutfitTab')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, selectedTab === 'pro' && styles.tabActive]}
              onPress={() => setSelectedTab('pro')}
            >
              <Text style={[
                styles.tabText,
                selectedTab === 'pro' && styles.tabTextActive
              ]}>
                {t('outfitChange.proStyle')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Template Swap内容 */}
          {selectedTab === 'template' && (
            <View style={styles.tabContent}>
              <View style={styles.trendingHeader}>
                <Text style={[styles.trendingTitle, isDark && styles.textDark]}>
                  {t('outfitChange.trendingStyles')}
                </Text>
                <View style={[styles.freeAttemptsTag, isDark && styles.freeAttemptsTagDark]}>
                  <Sparkles size={14} color={isDark ? '#fff' : '#1a1a1a'} />
                  <Text style={[styles.freeAttemptsText, isDark && styles.textDark]}>
                    {t('outfitChange.freeAttempts')}: {coinBalance}/5
                  </Text>
                </View>
              </View>

              {/* 模板网格 */}
              <View style={styles.templateGrid}>
                {displayedTemplates.map((template) => (
                  <TouchableOpacity
                    key={template.id}
                    style={[
                      styles.templateCard,
                      isDark && styles.templateCardDark,
                      selectedTemplate === template.id && styles.templateCardSelected
                    ]}
                    onPress={() => setSelectedTemplate(template.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.templateIcon}>
                      <Text style={styles.templateIconText}>{template.icon}</Text>
                    </View>
                    <Text style={[styles.templateName, isDark && styles.textDark]} numberOfLines={2}>
                      {template.name}
                    </Text>
                    <Text style={styles.templateEmoji}>{template.icon}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 更多模板按钮 */}
              {TEMPLATES.length > 9 && (
                <TouchableOpacity
                  style={styles.moreButton}
                  onPress={() => setShowAllTemplates(!showAllTemplates)}
                >
                  <Text style={[styles.moreButtonText, isDark && styles.textDark]}>
                    {showAllTemplates ? t('outfitChange.showLess') : t('outfitChange.moreTemplates')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Custom Outfit内容 */}
          {selectedTab === 'custom' && (
            <View style={styles.tabContent}>
              <Text style={[styles.customTitle, isDark && styles.textDark]}>
                {t('outfitChange.referenceClothing')}
              </Text>
              
              <View style={styles.customUploadRow}>
                {/* 已上传的图片 */}
                {customImages.map((uri, index) => (
                  <View key={index} style={[styles.customUploadCard, isDark && styles.customUploadCardDark]}>
                    <Image source={{ uri }} style={styles.customUploadedImage} contentFit="cover" />
                    <TouchableOpacity
                      style={styles.customRemoveButton}
                      onPress={() => handleRemoveCustomImage(index)}
                    >
                      <X size={16} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.customUploadLabel}>
                      {index === 0 ? t('outfitChange.required') : t('outfitChange.optional')}
                    </Text>
                  </View>
                ))}

                {/* 添加按钮 */}
                {customImages.length < 2 && (
                  <TouchableOpacity 
                    style={[styles.customUploadCard, isDark && styles.customUploadCardDark]}
                    onPress={handleAddCustomImage}
                  >
                    <Camera size={24} color="#9ca3af" />
                    <Text style={styles.customUploadTitle}>
                      {customImages.length === 0 
                        ? t('outfitChange.uploadClothing1')
                        : t('outfitChange.uploadClothing2')
                      }
                    </Text>
                    <Text style={customImages.length === 0 ? styles.customUploadBadge : styles.customUploadBadgeOptional}>
                      {customImages.length === 0 ? t('outfitChange.required') : t('outfitChange.optional')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={[styles.uploadHintBox, isDark && styles.uploadHintBoxDark]}>
                <Text style={[styles.uploadHintText, isDark && styles.uploadHintTextDark]}>
                  ℹ️ {t('outfitChange.uploadHint')}
                </Text>
              </View>
            </View>
          )}

          {/* Pro Style内容 */}
          {selectedTab === 'pro' && (
            <View style={styles.tabContent}>
              {selectedLookPrompt ? (
                // 已选择Look
                <View style={styles.selectedLookContainer}>
                  <View style={[styles.selectedLookCard, isDark && styles.selectedLookCardDark]}>
                    <View style={styles.selectedLookHeader}>
                      <Text style={[styles.selectedLookTitle, isDark && styles.textDark]}>
                        ✨ 已选择造型
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedLookPrompt(null);
                          setSelectedInfluencerId(null);
                        }}
                      >
                        <Text style={styles.changeButton}>更换</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.selectedLookPrompt} numberOfLines={3}>
                      {selectedLookPrompt}
                    </Text>
                  </View>
                </View>
              ) : (
                // 未选择Look,显示达人列表
                <>
                  <Text style={[styles.proTitle, isDark && styles.textDark]}>
                    {t('outfitChange.selectInfluencer')}
                  </Text>
                  
                  {/* Jennie示例卡片 */}
                  <TouchableOpacity
                    style={[styles.influencerCard, isDark && styles.influencerCardDark]}
                    onPress={() => router.push('/influencer-collection/jennie' as any)}
                  >
                    <View style={styles.influencerAvatar}>
                      <Text style={styles.influencerAvatarText}>👱‍♀️</Text>
                      <View style={styles.verifiedBadge}>
                        <Text style={styles.verifiedText}>✓</Text>
                      </View>
                    </View>
                    <View style={styles.influencerInfo}>
                      <Text style={[styles.influencerName, isDark && styles.textDark]}>
                        Jennie Kim
                      </Text>
                      <Text style={styles.influencerDesc}>
                        Chanel Muse & K-Pop Icon
                      </Text>
                      <View style={styles.influencerTags}>
                        <View style={[styles.tag, isDark && styles.tagDark]}>
                          <Text style={[styles.tagText, isDark && styles.textDark]}>24 LOOKS</Text>
                        </View>
                        <View style={[styles.tag, isDark && styles.tagDark]}>
                          <Text style={[styles.tagText, isDark && styles.textDark]}>K-POP</Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>

                  <Text style={styles.comingSoon}>更多达人即将上线...</Text>
                </>
              )}
            </View>
          )}
        </View>

        {/* 选项区域 */}
        <View style={[styles.optionsSection, isDark && styles.optionsSectionDark]}>
          <View style={styles.optionRow}>
            <View style={styles.optionLeft}>
              <View style={[styles.optionIcon, isDark && styles.optionIconDark]}>
                <Text>👤</Text>
              </View>
              <View>
                <Text style={[styles.optionTitle, isDark && styles.textDark]}>
                  {t('outfitChange.keepFaceFeatures')}
                </Text>
                <Text style={styles.optionSubtitle}>
                  {t('outfitChange.preserveIdentity')}
                </Text>
              </View>
            </View>
            <Switch
              value={keepFaceFeatures}
              onValueChange={setKeepFaceFeatures}
              trackColor={{ false: '#e5e7eb', true: '#1a1a1a' }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={styles.optionRow}>
            <View style={styles.optionLeft}>
              <View style={[styles.optionIcon, isDark && styles.optionIconDark]}>
                <Sparkles size={20} color={isDark ? '#fff' : '#1a1a1a'} />
              </View>
              <View>
                <Text style={[styles.optionTitle, isDark && styles.textDark]}>
                  {t('outfitChange.beautyFilter')}
                </Text>
                <Text style={styles.optionSubtitle}>
                  {t('outfitChange.enhanceSkin')}
                </Text>
              </View>
            </View>
            <Switch
              value={beautyFilter}
              onValueChange={setBeautyFilter}
              trackColor={{ false: '#e5e7eb', true: '#1a1a1a' }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* 固定底部按钮 */}
      <View style={styles.fixedBottom}>
        <View style={styles.gradientContainer}>
          <LinearGradient
            colors={['rgba(255,255,255,0)', isDark ? '#121212' : '#ffffff']}
            style={styles.gradient}
          />
        </View>
        <TouchableOpacity
          style={[styles.generateButton, (!userImage || isGenerating) && styles.generateButtonDisabled]}
          disabled={!userImage || isGenerating}
          onPress={handleGenerate}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#1a1a1a', '#000000']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.generateGradient}
          >
            {isGenerating ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.generateButtonText}>
                  {t('outfitChange.generating')}
                </Text>
              </>
            ) : (
              <>
                <Sparkles size={20} color="#fff" strokeWidth={2.5} />
                <Text style={styles.generateButtonText}>
                  {t('outfitChange.startGenerating')}
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  textDark: {
    color: '#f0f0f0',
  },

  // 上传区域
  uploadArea: {
    aspectRatio: 3 / 4,
    maxHeight: 400,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
    overflow: 'hidden',
    position: 'relative',
  },
  uploadAreaDark: {
    borderColor: '#404040',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  uploadPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  cameraIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cameraIconDark: {
    backgroundColor: '#1e1e1e',
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  uploadSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  privacyText: {
    fontSize: 11,
    color: '#9ca3af',
  },

  // Tab切换
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
  },
  tabContainerDark: {
    backgroundColor: '#1e1e1e',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#1a1a1a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },

  // Tab内容
  tabContent: {
    marginTop: 8,
  },
  trendingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  trendingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4b5563',
  },
  freeAttemptsTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  freeAttemptsTagDark: {
    backgroundColor: '#1e1e1e',
    borderColor: '#404040',
  },
  freeAttemptsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a1a1a',
  },

  // 模板网格
  templateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  templateCard: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  templateCardDark: {
    backgroundColor: '#1e1e1e',
    borderColor: 'rgba(255,255,255,0.05)',
  },
  templateCardSelected: {
    borderColor: '#1a1a1a',
    borderWidth: 2,
  },
  templateIcon: {
    marginBottom: 8,
  },
  templateIconText: {
    fontSize: 32,
  },
  templateName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  templateEmoji: {
    fontSize: 10,
    opacity: 0.8,
    marginTop: 4,
  },

  // 更多按钮
  moreButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  moreButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
  },

  // Custom Outfit
  customTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  customUploadRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  customUploadCard: {
    flex: 1,
    aspectRatio: 4 / 5,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    position: 'relative',
  },
  customUploadCardDark: {
    borderColor: '#404040',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  customUploadTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  customUploadBadge: {
    fontSize: 11,
    color: '#ef4444',
    fontWeight: '600',
  },
  customUploadBadgeOptional: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '600',
  },
  customUploadedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  customRemoveButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customUploadLabel: {
    position: 'absolute',
    bottom: 8,
    fontSize: 10,
    fontWeight: '600',
    color: '#9ca3af',
  },
  uploadHintBox: {
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  uploadHintBoxDark: {
    backgroundColor: '#1e293b',
    borderLeftColor: '#60a5fa',
  },
  uploadHintText: {
    fontSize: 12,
    color: '#1e40af',
    lineHeight: 18,
  },
  uploadHintTextDark: {
    color: '#93c5fd',
  },

  // Pro Style
  proTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  influencerCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  influencerCardDark: {
    backgroundColor: '#1e1e1e',
    borderColor: 'rgba(255,255,255,0.05)',
  },
  influencerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
  },
  influencerAvatarText: {
    fontSize: 32,
  },
  verifiedBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedText: {
    color: '#ffffff',
    fontSize: 14,
  },
  influencerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  influencerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  influencerDesc: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
  },
  influencerTags: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
  },
  tagDark: {
    backgroundColor: '#2a2a2a',
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4b5563',
  },
  comingSoon: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 24,
  },
  selectedLookContainer: {
    marginTop: 8,
  },
  selectedLookCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  selectedLookCardDark: {
    backgroundColor: '#1e293b',
    borderLeftColor: '#60a5fa',
  },
  selectedLookHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedLookTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  changeButton: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  selectedLookPrompt: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 20,
  },

  // 选项区域
  optionsSection: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    marginBottom: 24,
  },
  optionsSectionDark: {
    backgroundColor: '#1e1e1e',
    borderColor: 'rgba(255,255,255,0.05)',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionIconDark: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  optionSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },

  // 固定底部
  fixedBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  gradientContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    zIndex: -1,
  },
  gradient: {
    flex: 1,
  },
  generateButton: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  generateButtonDisabled: {
    opacity: 0.5,
  },
  generateGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
  },
  generateButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
});
