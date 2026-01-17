import { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy';

import { Shirt, Download, Share2, ArrowLeft, Sparkles } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useCoin } from '@/contexts/CoinContext';
import { useVerification } from '@/contexts/VerificationContext';
import { useSquare } from '@/contexts/SquareContext';
import { useAuth } from '@/contexts/AuthContext';
import BeautyFilter, { BeautyParams } from '@/components/BeautyFilter';

type Template = {
  id: string;
  name: string;
  nameEn: string;
  prompt: string;
  icon: string;
};

const COMMON_PROMPT_PREFIX = 'IMPORTANT: Keep face, facial expression, hairstyle, pose, and photo framing EXACTLY as in original. Only change clothing in the EXACT visible areas. If only partial clothing is visible, apply only to that partial area. Do NOT extend or complete the image. ';
const TEMPLATE_VARIATION_SUFFIX = ' Within this template, generate varied designs each time: change silhouettes, colors, patterns, fabrics, and accessories to offer multiple distinct looks while staying inside this style category.';

// 超级随机装模板库 - 100+种独特风格
const RANDOM_OUTFIT_STYLES = [
  // 现有模板风格
  'Bikini swimsuit - traditional two-piece, one-piece, or stylish monokini with beach resort style',
  'Formal business attire - professional suit and tie or elegant business dress',
  'Starbucks barista uniform - green apron with logo, black shirt, coffee shop staff style',
  'Korean Adidas Original sportswear - trendy athletic clothing with street fashion style',
  'Wedding attire - elegant wedding dress or formal tuxedo',
  'Traditional Chinese Hanfu - ancient elegant robes with cultural heritage',
  'Superhero costume - cape and heroic style with bold colors',
  'Chinese New Year festive clothing - red and gold with auspicious patterns',
  'Old money style - timeless elegant clothing with coat draped over shoulders',
  'Tennis outfit - tennis skirt/shorts with polo shirt, athletic sportswear',
  'Chinese God of Wealth costume - traditional red and gold robes',
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

// 迪士尼公主装风格库 - 10种经典公主造型
const DISNEY_PRINCESS_STYLES = [
  'Cinderella style - iconic blue ball gown with sparkles, glass slippers, elegant updo with tiara, magical fairytale princess look',
  'Snow White style - classic yellow and blue dress with puffed sleeves, red bow headband, innocent and sweet princess appearance',
  'Belle (Beauty and the Beast) style - golden yellow ball gown, off-shoulder design, elegant and intelligent princess look with rose details',
  'Ariel (The Little Mermaid) style - shimmering purple seashell top with flowing turquoise tail-inspired gown, ocean princess aesthetic',
  'Aurora (Sleeping Beauty) style - romantic pink ball gown with flowing cape, golden tiara, dreamy and graceful princess elegance',
  'Jasmine (Aladdin) style - turquoise two-piece outfit with gold trim, harem pants, jeweled headband, Arabian princess exotic beauty',
  'Rapunzel (Tangled) style - purple and pink corset dress with flowing sleeves, flower crown in long golden hair, adventurous princess charm',
  'Elsa (Frozen) style - ice blue sparkling gown with snowflake patterns, platinum blonde braid, regal ice queen princess majesty',
  'Moana style - red and cream Polynesian dress with tribal patterns, flower in hair, ocean-inspired island princess warrior look',
  'Tiana (Princess and the Frog) style - elegant green ball gown with lily pad details, tiara, 1920s-inspired New Orleans princess glamour',
];

// 随机选择一种迪士尼公主风格
function getRandomPrincessStyle(): string {
  const randomIndex = Math.floor(Math.random() * DISNEY_PRINCESS_STYLES.length);
  return DISNEY_PRINCESS_STYLES[randomIndex];
}

// Jennie穿搭风格库 - 20+种经典造型
const JENNIE_OUTFIT_STYLES = [
  'Jennie Chanel style - luxury Chanel tweed jacket with mini skirt, pearl accessories, elegant high fashion look with sophisticated French luxury vibes',
  'Jennie airport fashion - oversized blazer, crop top, high-waisted jeans, designer sunglasses, effortlessly chic street style',
  'Jennie stage performance - crystal embellished bodysuit with high boots, bold and glamorous concert outfit with sexy confident energy',
  'Jennie Coachella style - colorful bohemian crop top with denim shorts, festival-ready look with playful accessories and braided hair',
  'Jennie pink princess - all pink outfit with oversized pink blazer, pink mini dress, girly yet edgy Barbie-inspired aesthetic',
  'Jennie leather look - black leather jacket with leather pants or skirt, rock chic style with bold attitude and fierce energy',
  'Jennie preppy style - pleated mini skirt with cardigan or knit top, school girl inspired look with youthful charm',
  'Jennie tennis outfit - white tennis dress or tennis skirt with polo top, sporty yet fashionable athletic look',
  'Jennie designer suit - tailored oversized designer suit with crop top or bralette underneath, powerful boss lady style',
  'Jennie vintage 90s - vintage inspired crop top with low-rise jeans, retro 90s Y2K aesthetic with nostalgic vibes',
  'Jennie casual street - oversized hoodie or sweatshirt with bike shorts, comfortable yet stylish everyday street style',
  'Jennie red carpet - elegant evening gown with sparkles or satin finish, glamorous Hollywood star look',
  'Jennie denim style - denim jacket with denim skirt or jeans, all-denim Canadian tuxedo look with cool factor',
  'Jennie black & white - classic black and white color blocking outfit, timeless monochrome elegance',
  'Jennie crop top queen - various styles of crop tops with high-waisted bottoms, showing off her famous abs and confident style',
  'Jennie Celine fashion - minimalist Celine designer pieces, sophisticated modern luxury style',
  'Jennie edgy grunge - ripped jeans with band tees or graphic tops, rebellious grunge aesthetic with chains and boots',
  'Jennie feminine floral - floral mini dress or floral top with skirt, romantic feminine style with delicate patterns',
  'Jennie athleisure - designer sports bra with matching leggings or track pants, high-end athletic wear style',
  'Jennie blazer power - oversized blazer as dress or with shorts underneath, powerful fashion-forward statement look',
  'Jennie summer vacation - breezy summer dress or romper, vacation-ready look with sun hat and sunglasses',
  'Jennie winter chic - luxury fur coat or long wool coat with designer boots, elegant winter fashion',
  'Jennie party outfit - sparkly mini dress or sequin top with leather pants, ready for nightclub glamour',
  'Jennie Korean street fashion - trendy Korean street style with layered pieces, oversized fits, and unique accessories',
];

// 随机选择一种Jennie穿搭风格
function getRandomJennieStyle(): string {
  const randomIndex = Math.floor(Math.random() * JENNIE_OUTFIT_STYLES.length);
  return JENNIE_OUTFIT_STYLES[randomIndex];
}

const templates: Template[] = [
  {
    id: 'random',
    name: '随机装',
    nameEn: 'Random Style',
    // 注意：实际的 prompt 会在生成时动态创建
    prompt: COMMON_PROMPT_PREFIX + 'RANDOM_STYLE_PLACEHOLDER',
    icon: '🎲',
  },
  {
    id: 'jennie',
    name: 'Jennie同款',
    nameEn: 'Jennie Style',
    // 注意：实际的 prompt 会在生成时动态创建
    prompt: COMMON_PROMPT_PREFIX + 'JENNIE_STYLE_PLACEHOLDER',
    icon: '💖',
  },
  {
    id: 'bikini',
    name: '比基尼',
    nameEn: 'Bikini',
    prompt: COMMON_PROMPT_PREFIX + 'Change the outfit to a bikini swimsuit with diverse and fashionable styles - can be traditional two-piece bikini, one-piece swimsuit, or stylish monokini. Various styles including sporty, elegant, trendy, colorful patterns, solid colors, or prints. Beach and resort style with variety and fashion-forward designs',
    icon: '👙',
  },
  {
    id: 'formal',
    name: '正装',
    nameEn: 'Formal',
    prompt: COMMON_PROMPT_PREFIX + 'Change the outfit to formal business attire - suit and tie for men or professional dress for women. Provide different cuts (slim/relaxed), colors (navy/charcoal/black), and fabric textures to keep variety.',
    icon: '👔',
  },
  {
    id: 'starbucks-barista',
    name: '咖啡师-星巴克',
    nameEn: 'Starbucks Barista',
    prompt: COMMON_PROMPT_PREFIX + 'Change the outfit to Starbucks barista uniform - green apron with Starbucks logo, black shirt, professional coffee shop staff attire. Offer seasonal/variant aprons, layered tops, and slight accessory variations while keeping the barista identity.',
    icon: '☕',
  },
  {
    id: 'sport',
    name: '运动装',
    nameEn: 'Sportswear',
    prompt: COMMON_PROMPT_PREFIX + 'Change the outfit to Korean style Adidas Original athletic sportswear - trendy Adidas Original sports clothing with Korean street fashion style, modern and stylish. Provide varied outfits (tracksuit/hoodie+tapered pants/shorts), different colorways and stripe details.',
    icon: '🏃',
  },
  {
    id: 'fairytale-princess',
    name: '童话公主装',
    nameEn: 'Fairytale Princess',
    prompt: COMMON_PROMPT_PREFIX + 'Change the outfit to magical fairytale princess dress - elegant ball gown with sparkles, tiara or crown, royal and enchanting style like Disney princesses, dreamy and magical appearance',
    icon: '👸',
  },
  {
    id: 'wedding',
    name: '婚纱/礼服',
    nameEn: 'Wedding',
    prompt: COMMON_PROMPT_PREFIX + 'Change the outfit to elegant wedding attire - wedding dress for women or formal tuxedo for men. Include variations: A-line, mermaid, ball gown, minimalist satin, lace overlays, or tux color accents.',
    icon: '👰',
  },
  {
    id: 'traditional',
    name: '汉服',
    nameEn: 'Hanfu',
    prompt: COMMON_PROMPT_PREFIX + 'Change the outfit to traditional Chinese Hanfu clothing with elegant ancient style. Provide varied colors, sleeve shapes, and patterns (floral/cloud motifs) while keeping authentic Hanfu aesthetics.',
    icon: '🏮',
  },
  {
    id: 'superhero',
    name: '超级英雄',
    nameEn: 'Superhero',
    prompt: COMMON_PROMPT_PREFIX + 'Change the outfit to a superhero costume with cape and heroic style. Offer variations in suit lines, emblems, cape lengths, and color schemes while keeping heroic look.',
    icon: '🦸',
  },
  {
    id: 'newyear-horse',
    name: '新年装-马年',
    nameEn: 'New Year - Year of Horse',
    prompt: COMMON_PROMPT_PREFIX + 'Change the outfit to Chinese New Year festive clothing with horse year theme - red and gold colors, traditional patterns with horse motifs. Vary embroidery, trims, and accessory details for freshness.',
    icon: '🐴',
  },
  {
    id: 'old-money',
    name: '老钱风',
    nameEn: 'Old Money Style',
    prompt: COMMON_PROMPT_PREFIX + 'Change the outfit to old money style - classic, timeless, elegant clothing with subtle luxury, neutral colors, cashmere sweaters, tailored pieces, and a coat casually draped over the shoulders. Provide varied pairings (blazer+slacks, trench+knit, pleated skirt+cardigan).',
    icon: '💰',
  },
  {
    id: 'tennis',
    name: '网球装',
    nameEn: 'Tennis Outfit',
    prompt: COMMON_PROMPT_PREFIX + 'Change the outfit to tennis sports attire - tennis skirt or shorts, polo shirt, athletic sportswear for tennis. Offer different skirt/short cuts, collar styles, stripe placements, and color blocking.',
    icon: '🎾',
  },
  {
    id: 'god-of-wealth',
    name: '财神装',
    nameEn: 'God of Wealth',
    prompt: COMMON_PROMPT_PREFIX + 'Change the outfit to Chinese God of Wealth costume - traditional red and gold robes with auspicious patterns and wealthy appearance. Provide varied embroidery, headdress details, and pattern density while keeping the deity theme.',
    icon: '💸',
  },
  {
    id: 'hot-girl',
    name: '辣妹装',
    nameEn: 'Hot Girl Style',
    prompt: COMMON_PROMPT_PREFIX + 'Change the outfit to hot trendy girl style - crop top, mini skirt, trendy streetwear, bold and fashionable modern clothing. Include variations: different crop top cuts, mini skirts/shorts, color pops, and accessories.',
    icon: '🔥',
  },
  {
    id: 'meituan-delivery',
    name: '美团外卖装',
    nameEn: 'Meituan Delivery',
    prompt: COMMON_PROMPT_PREFIX + 'Change the outfit to Meituan food delivery uniform - yellow and black delivery outfit, Meituan branded jacket and uniform. Provide variant jacket cuts, reflective stripes placements, and seasonal layering options.',
    icon: '🛵',
  },
  {
    id: 'ski',
    name: '滑雪服',
    nameEn: 'Ski Outfit',
    prompt: COMMON_PROMPT_PREFIX + 'Change the outfit to luxury designer ski wear - sleek modern ski jacket with ZIPPER FULLY CLOSED and ski pants from high-end brands, minimalist stylish design with clean lines, premium quality appearance. The jacket must be a proper ski jacket (NOT a hiking jacket or outdoor coat), fully zipped up, paired with fashionable ski goggles. Offer varied colorways and paneling while keeping designer look.',
    icon: '⛷️',
  },
  {
    id: 'flight-attendant',
    name: '空姐装',
    nameEn: 'Flight Attendant',
    prompt: COMMON_PROMPT_PREFIX + 'Change the outfit to flight attendant uniform - elegant airline uniform with scarf, professional aviation style. Provide airline-inspired variations (color palettes, scarf patterns, skirt vs pants) while keeping professional look.',
    icon: '✈️',
  },
  {
    id: 'outdoor',
    name: '户外装',
    nameEn: 'Outdoor',
    prompt: COMMON_PROMPT_PREFIX + 'Change the outfit to outdoor adventure clothing - hiking jacket, cargo pants, outdoor sports gear, functional outdoor wear. Offer varied layerings, pocket layouts, and colorways suited for outdoors.',
    icon: '🏔️',
  },
  {
    id: 'cowboy',
    name: '牛仔装',
    nameEn: 'Cowboy/Western',
    prompt: COMMON_PROMPT_PREFIX + 'Change the outfit to western cowboy style - denim jeans, cowboy boots, plaid shirt, western hat, rodeo style clothing. Provide different washes, plaid patterns, vest vs jacket options, and belt/buckle accents.',
    icon: '🤠',
  },
  {
    id: 'wizard',
    name: '魔法师装',
    nameEn: 'Wizard',
    prompt: COMMON_PROMPT_PREFIX + 'Change the outfit to magical wizard costume - flowing robes, pointed wizard hat, mystical and magical appearance with arcane style. Offer robe pattern variations, hat shapes, and accessory details (wands, brooches).',
    icon: '🧙',
  },
  {
    id: 'pirate',
    name: '海盗装',
    nameEn: 'Pirate',
    prompt: COMMON_PROMPT_PREFIX + 'Change the outfit to pirate costume - classic pirate clothing with tricorn hat, eye patch, pirate coat, adventurous seafarer style. Provide different coat cuts, sashes, hat decorations, and weathered textures.',
    icon: '🏴‍☠️',
  },
  {
    id: 'lolita',
    name: '洛丽塔',
    nameEn: 'Lolita',
    prompt: COMMON_PROMPT_PREFIX + 'Change the outfit to Lolita fashion with rich lace, bows, petticoats, and layered skirts. Offer sweet/classic/goth variations, different color palettes, and accessory details (headbows, lace gloves).',
    icon: '🎀',
  },
  {
    id: 'visual-kei',
    name: '视觉系',
    nameEn: 'Visual Kei',
    prompt: COMMON_PROMPT_PREFIX + 'Change the outfit to Visual Kei rock style - dramatic layers, bold contrast, ornate details, dark elegant vibe inspired by J-rock stage fashion. Provide varied layering, accessories, and makeup-inspired styling cues.',
    icon: '🦇',
  },
  {
    id: 'punk',
    name: '朋克装',
    nameEn: 'Punk',
    prompt: COMMON_PROMPT_PREFIX + 'Change the outfit to punk style - leather jackets, studs, tartan, ripped details, rebellious attitude. Offer varied layers, safety pins, patches, graphic tees, and different color pops.',
    icon: '🤘',
  },
];

type OutfitMode = 'template' | 'custom';

export default function OutfitChangeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { coinBalance, canUseOutfitChange, useOutfitChange, getRemainingFreeCounts } = useCoin();
  const { addOutfitChangeHistory } = useVerification();
  const { publishPost } = useSquare();
  const { user } = useAuth();
  const [mode, setMode] = useState<OutfitMode>('template');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [customOutfitImages, setCustomOutfitImages] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingTime, setGeneratingTime] = useState(0);
  const [resultUri, setResultUri] = useState<string | null>(null);
  const [resultHistoryId, setResultHistoryId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showAllTemplates, setShowAllTemplates] = useState(false);
  const [showBeautyFilter, setShowBeautyFilter] = useState(false);
  const [originalImageUri, setOriginalImageUri] = useState<string | null>(null);
  const [beautyApplied, setBeautyApplied] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.7, // 降低质量以减小文件大小，后续还会进一步压缩
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setImageUri(uri);
      setOriginalImageUri(uri);
      setResultUri(null);
      setBeautyApplied(false);
    }
  };

  const handleBeautyApply = (beautifiedUri: string, params: BeautyParams) => {
    setImageUri(beautifiedUri);
    setBeautyApplied(true);
    setShowBeautyFilter(false);
    Alert.alert(t('common.success'), t('beauty.beautySuccess'));
  };

  const handleBeautyClose = () => {
    setShowBeautyFilter(false);
  };

  const resetToOriginalImage = () => {
    if (originalImageUri) {
      setImageUri(originalImageUri);
      setBeautyApplied(false);
    }
  };

  const pickCustomOutfitImage = async () => {
    if (customOutfitImages.length >= 2) {
      Alert.alert(t('common.tip'), t('outfitChange.maxImagesReached'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.5, // 进一步降低质量以减小文件大小
      allowsMultipleSelection: true,
      selectionLimit: 2 - customOutfitImages.length,
    });

    if (!result.canceled && result.assets) {
      const newImages = result.assets.map(asset => asset.uri);
      setCustomOutfitImages(prev => [...prev, ...newImages].slice(0, 2));
      setResultUri(null);
    }
  };

  const removeCustomOutfitImage = (index: number) => {
    setCustomOutfitImages(prev => prev.filter((_, i) => i !== index));
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(t('errors.permissionDenied'), '需要相机权限');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.7, // 降低质量以减小文件大小，后续还会进一步压缩
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setResultUri(null);
    }
  };

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
              console.log('[compressImageWeb] Original size:', blob.size, 'Compressed size:', compressedBlob.size);
              resolve(compressedBlob);
            } else {
              reject(new Error('Failed to compress image'));
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

  const generateOutfitChange = async () => {
    if (!imageUri) {
      Alert.alert(t('common.tip'), t('outfitChange.selectImage'));
      return;
    }

    if (mode === 'template' && !selectedTemplate) {
      Alert.alert(t('common.tip'), t('outfitChange.selectImageAndTemplate'));
      return;
    }

    if (mode === 'custom' && customOutfitImages.length === 0) {
      Alert.alert(t('common.tip'), t('outfitChange.selectOutfitImages'));
      return;
    }

    // 检查是否可以使用换装功能
    const { canUse, message } = canUseOutfitChange();
    if (!canUse) {
      Alert.alert(t('common.tip'), message);
      return;
    }

    setIsGenerating(true);
    setResultUri(null);
    setGeneratingTime(0);

    // 开始计时
    const startTime = Date.now();
    const timer = setInterval(() => {
      setGeneratingTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    try {
      console.log('[OutfitChange] Starting generation, mode:', mode);
      // 始终启用压缩以避免413错误
      const base64Image = await convertToBase64(imageUri, true, true); // 强制压缩主图
      console.log('[OutfitChange] Main image converted, size:', base64Image.length);
      
      let requestBody;
      if (mode === 'template') {
        // 如果是随机装、童话公主装或Jennie同款，每次动态生成一个完全不同的风格
        let finalPrompt = selectedTemplate!.prompt;
        
        if (selectedTemplate!.id === 'random') {
          const randomStyle = getRandomOutfitStyle();
          finalPrompt = COMMON_PROMPT_PREFIX + `Change the outfit to: ${randomStyle}. IMPORTANT: Create a COMPLETE OUTFIT SOLUTION with matching accessories, bag/purse, and shoes that perfectly coordinate with this style. The accessories, footwear, and bag should complement and enhance the overall look to create a cohesive, well-styled ensemble. Be creative and ensure the style is distinct and unique!`;
          console.log('[OutfitChange] Random style selected:', randomStyle);
        } else if (selectedTemplate!.id === 'jennie') {
          const jennieStyle = getRandomJennieStyle();
          finalPrompt = COMMON_PROMPT_PREFIX + `Transform into Jennie from BLACKPINK fashion style: ${jennieStyle}. IMPORTANT: Recreate Jennie's iconic fashion sense with authentic details - capture her signature style elements, proportions, and overall vibe. Create a COMPLETE OUTFIT with matching accessories, bag, and shoes that Jennie would actually wear. Make it look like a real Jennie outfit transformation with her characteristic confidence and fashion-forward aesthetic!`;
          console.log('[OutfitChange] Jennie style selected:', jennieStyle);
        } else if (selectedTemplate!.id === 'fairytale-princess') {
          const princessStyle = getRandomPrincessStyle();
          finalPrompt = COMMON_PROMPT_PREFIX + `Change the outfit to magical Disney princess dress: ${princessStyle}. Create an enchanting and authentic princess transformation with all the iconic details. Make it look like a real Disney princess came to life!`;
          console.log('[OutfitChange] Princess style selected:', princessStyle);
        } else {
          // 其他模板统一增加"同类别内多样化"指令
          finalPrompt = `${selectedTemplate!.prompt} ${TEMPLATE_VARIATION_SUFFIX}`;
        }
        
        requestBody = {
          prompt: finalPrompt,
          images: [{ type: 'image', image: base64Image }],
          aspectRatio: '3:4',
        };
        console.log('[OutfitChange] Template mode request body prepared');
      } else {
        // 自定义穿搭模式
        console.log('[OutfitChange] Custom mode, converting', customOutfitImages.length, 'outfit images');
        
        try {
          const outfitBase64Images = await Promise.all(
            customOutfitImages.map(async (uri, index) => {
              console.log(`[OutfitChange] Converting outfit image ${index + 1}/${customOutfitImages.length}`);
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
      }
      
      // 计算请求体大小
      const requestBodyString = JSON.stringify(requestBody);
      const requestSizeKB = Math.round(requestBodyString.length / 1024);
      const requestSizeMB = (requestSizeKB / 1024).toFixed(2);
      console.log('[OutfitChange] Request body size:', requestSizeKB, 'KB (', requestSizeMB, 'MB)');
      
      // 如果请求体超过5MB，警告用户（经验显示超过5MB容易失败）
      if (requestBodyString.length > 5 * 1024 * 1024) {
        console.warn('[OutfitChange] Request body is very large:', requestSizeMB, 'MB');
        Alert.alert(
          t('common.tip'),
          `图片数据较大（${requestSizeMB}MB），很可能会生成失败。\n\n强烈建议：${mode === 'custom' ? '只上传1张服饰图片' : '选择更小的照片'}`,
          [
            { text: t('common.cancel'), style: 'cancel', onPress: () => { 
              clearInterval(timer);
              setIsGenerating(false);
              setGeneratingTime(0);
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
          // 即使已经压缩，仍然过大，建议减少图片数量
          const suggestion = mode === 'custom' 
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
      
      setResultUri(generatedImageUri);
      
      // 提示用户图片已生成
      Alert.alert(t('common.success'), '图片已生成');
      
      // 使用换装次数（可能消耗免费次数或金币）
      await useOutfitChange();
      
      // 保存到历史记录
      try {
        const templateId = mode === 'template' ? selectedTemplate!.id : 'custom-outfit';
        const templateName = mode === 'template' ? selectedTemplate!.name : t('outfitChange.customOutfit');
        
        const historyId = await addOutfitChangeHistory(
          imageUri,
          generatedImageUri,
          templateId,
          templateName
        );
        setResultHistoryId(historyId);
      } catch (historyError) {
        console.error('Failed to save to history:', historyError);
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
      clearInterval(timer);
      setIsGenerating(false);
      setGeneratingTime(0);
    }
  };

  const downloadImage = async () => {
    if (!resultUri) return;

    setIsDownloading(true);

    try {
      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = resultUri;
        link.download = `outfit-change-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        Alert.alert(t('common.success'), t('outfitChange.downloadSuccess'));
      } else {
        // 请求相册权限
        console.log('Requesting media library permission...');
        const { status } = await MediaLibrary.requestPermissionsAsync();
        
        if (status !== 'granted') {
          console.error('Media library permission denied');
          Alert.alert(t('errors.permissionDenied'), t('outfitChange.mediaLibraryPermission'));
          return;
        }

        console.log('Permission granted, preparing to save image...');

        // 如果是 base64 数据 URL，需要先保存为临时文件
        let fileUri = resultUri;
        if (resultUri.startsWith('data:')) {
          const filename = `outfit-change-${Date.now()}.jpg`;
          fileUri = `${FileSystem.cacheDirectory}${filename}`;
          
          console.log('Converting base64 to file:', fileUri);
          const base64Data = resultUri.split(',')[1];
          await FileSystem.writeAsStringAsync(fileUri, base64Data, {
            encoding: FileSystem.EncodingType.Base64,
          });
          console.log('File saved to cache directory');
        }

        // 使用 saveToLibraryAsync 直接保存到相册
        console.log('Saving to gallery:', fileUri);
        await MediaLibrary.saveToLibraryAsync(fileUri);
        console.log('Image saved to gallery successfully');
        Alert.alert(t('common.success'), t('outfitChange.downloadSuccess'));
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert(t('common.error'), t('outfitChange.downloadFailed'));
    } finally {
      setIsDownloading(false);
    }
  };

  const publishToSquare = async () => {
    if (!resultUri || !imageUri || !user || !resultHistoryId) {
      if (!user) {
        Alert.alert(t('common.tip'), t('square.loginRequired'));
      }
      return;
    }

    const templateName = mode === 'template' 
      ? (selectedTemplate?.name || '') 
      : t('outfitChange.customOutfit');

    setIsPublishing(true);
    try {
      const postId = await publishPost({
        userId: user.userId,
        userNickname: user.nickname || user.userId,
        userAvatar: user.avatar,
        postType: 'outfitChange',
        outfitChangeId: resultHistoryId,
        originalImageUri: imageUri,
        resultImageUri: resultUri,
        templateName: templateName,
        pinnedCommentId: undefined,
      });

      Alert.alert(
        t('common.success'),
        t('square.publishSuccessPrompt'),
        [
          {
            text: t('common.no'),
            style: 'cancel',
          },
          {
            text: t('common.yes'),
            onPress: () => {
              router.push({
                pathname: '/(tabs)/square',
                params: { postId },
              } as any);
            },
          },
        ]
      );
    } catch (error) {
      console.error('Failed to publish to square:', error);
      Alert.alert(t('common.error'), t('square.publishFailed'));
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: t('outfitChange.title'),
          headerStyle: { backgroundColor: '#fff' },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginLeft: 8 }}
              activeOpacity={0.6}
            >
              <ArrowLeft size={24} color="#0F172A" strokeWidth={2} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity 
              style={styles.headerRightContainer}
              onPress={() => router.push('/recharge' as any)}
              activeOpacity={0.7}
            >
              <View style={styles.coinBadge}>
                <Text style={styles.coinIcon}>💰</Text>
                <Text style={styles.coinText}>{coinBalance}</Text>
              </View>
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('outfitChange.uploadImage')}</Text>
          <Text style={styles.sectionDesc}>{t('outfitChange.uploadImageDesc')}</Text>
          
          {imageUri ? (
            <View style={styles.imagePreview}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} contentFit="cover" />
              <View style={styles.imageActions}>
                <TouchableOpacity style={styles.reuploadButton} onPress={pickImage}>
                  <Text style={styles.reuploadText}>{t('outfitChange.reupload')}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.beautyButton, beautyApplied && styles.beautyButtonActive]} 
                  onPress={() => setShowBeautyFilter(true)}
                >
                  <Sparkles size={16} color={beautyApplied ? "#FFFFFF" : "#3B82F6"} strokeWidth={2} />
                  <Text style={[styles.beautyButtonText, beautyApplied && styles.beautyButtonTextActive]}>
                    {beautyApplied ? '已美颜' : t('outfitChange.applyBeauty')}
                  </Text>
                </TouchableOpacity>
                {beautyApplied && (
                  <TouchableOpacity style={styles.resetBeautyButton} onPress={resetToOriginalImage}>
                    <Text style={styles.resetBeautyText}>恢复原图</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.uploadButtons}>
              <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                <Text style={styles.uploadIcon}>📁</Text>
                <Text style={styles.uploadButtonText}>{t('upload.selectPhoto')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.uploadButton} onPress={takePhoto}>
                <Text style={styles.uploadIcon}>📷</Text>
                <Text style={styles.uploadButtonText}>{t('upload.takePhoto')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('outfitChange.selectMode')}</Text>
          <View style={styles.modeSelector}>
            <TouchableOpacity
              style={[styles.modeButton, mode === 'template' && styles.modeButtonActive]}
              onPress={() => {
                setMode('template');
                setResultUri(null);
              }}
            >
              <Text style={[styles.modeButtonText, mode === 'template' && styles.modeButtonTextActive]}>
                {t('outfitChange.templateMode')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeButton, mode === 'custom' && styles.modeButtonActive]}
              onPress={() => {
                setMode('custom');
                setResultUri(null);
              }}
            >
              <Text style={[styles.modeButtonText, mode === 'custom' && styles.modeButtonTextActive]}>
                {t('outfitChange.customMode')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {mode === 'template' ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('outfitChange.selectTemplate')}</Text>
              <View style={styles.costBadge}>
                <Text style={styles.costBadgeText}>🎁 {t('outfitChange.remainingFree')}: {getRemainingFreeCounts().outfitChange}</Text>
              </View>
            </View>
            <Text style={styles.sectionDesc}>{t('outfitChange.selectTemplateDesc')}</Text>
            
            <View style={styles.templatesGrid}>
            {(showAllTemplates ? templates : templates.slice(0, 9)).map((template) => (
              <TouchableOpacity
                key={template.id}
                style={[
                  styles.templateCard,
                  selectedTemplate?.id === template.id && styles.templateCardSelected,
                ]}
                onPress={() => setSelectedTemplate(template)}
                disabled={isGenerating}
              >
                <Text style={styles.templateIcon}>{template.icon}</Text>
                <Text style={styles.templateName}>{t(`outfitChange.templates.${template.id}`)}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {!showAllTemplates && templates.length > 9 && (
            <TouchableOpacity 
              style={styles.showMoreButton}
              onPress={() => setShowAllTemplates(true)}
              disabled={isGenerating}
            >
              <Text style={styles.showMoreButtonText}>{t('outfitChange.showMore')}</Text>
              <Text style={styles.showMoreButtonIcon}>▼</Text>
            </TouchableOpacity>
          )}
          
          {showAllTemplates && (
            <TouchableOpacity 
              style={styles.showMoreButton}
              onPress={() => setShowAllTemplates(false)}
              disabled={isGenerating}
            >
              <Text style={styles.showMoreButtonText}>{t('outfitChange.showLess')}</Text>
              <Text style={styles.showMoreButtonIcon}>▲</Text>
            </TouchableOpacity>
          )}
        </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('outfitChange.uploadOutfitImages')}</Text>
              <View style={styles.costBadge}>
                <Text style={styles.costBadgeText}>🎁 {t('outfitChange.remainingFree')}: {getRemainingFreeCounts().outfitChange}</Text>
              </View>
            </View>
            <Text style={styles.sectionDesc}>{t('outfitChange.uploadOutfitImagesDesc')}</Text>
            
            <View style={styles.outfitImagesContainer}>
              {customOutfitImages.map((uri, index) => (
                <View key={index} style={styles.outfitImageItem}>
                  <Image source={{ uri }} style={styles.outfitImagePreview} contentFit="cover" />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeCustomOutfitImage(index)}
                  >
                    <Text style={styles.removeImageText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
              
              {customOutfitImages.length < 2 && (
                <TouchableOpacity
                  style={styles.addOutfitImageButton}
                  onPress={pickCustomOutfitImage}
                  disabled={isGenerating}
                >
                  <Text style={styles.addOutfitImageIcon}>+</Text>
                  <Text style={styles.addOutfitImageText}>{t('outfitChange.addImage')}</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {customOutfitImages.length > 0 && (
              <Text style={styles.imageCountText}>
                {t('outfitChange.imageCount', { count: customOutfitImages.length, max: 2 })}
              </Text>
            )}
          </View>
        )}

        {resultUri && (
          <View style={styles.section}>
            <View style={styles.resultHeader}>
              <Text style={styles.sectionTitle}>{t('outfitChange.result')}</Text>
              <View style={styles.resultActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={publishToSquare}
                  disabled={isPublishing}
                >
                  {isPublishing ? (
                    <ActivityIndicator size="small" color="#0066FF" />
                  ) : (
                    <>
                      <Share2 size={16} color="#0066FF" />
                      <Text style={styles.actionButtonText}>{t('square.publishToSquare')}</Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={downloadImage}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <ActivityIndicator size="small" color="#0066FF" />
                  ) : (
                    <>
                      <Download size={16} color="#0066FF" />
                      <Text style={styles.actionButtonText}>{t('outfitChange.downloadToAlbum')}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.resultContainer}>
              <Image source={{ uri: resultUri }} style={styles.resultImage} contentFit="cover" />
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.generateButton,
            (
              !imageUri || 
              isGenerating || 
              (mode === 'template' && !selectedTemplate) || 
              (mode === 'custom' && customOutfitImages.length === 0)
            ) && styles.generateButtonDisabled,
          ]}
          onPress={generateOutfitChange}
          disabled={
            !imageUri || 
            isGenerating || 
            (mode === 'template' && !selectedTemplate) || 
            (mode === 'custom' && customOutfitImages.length === 0)
          }
        >
          {isGenerating ? (
            <View style={styles.generatingContainer}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.generateButtonText}>
                {t('outfitChange.generating')} {generatingTime}s
              </Text>
            </View>
          ) : (
            <Text style={styles.generateButtonText}>{t('outfitChange.generate')}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* 美颜滤镜 */}
      {imageUri && showBeautyFilter && (
        <BeautyFilter
          visible={showBeautyFilter}
          imageUri={originalImageUri || imageUri}
          onClose={handleBeautyClose}
          onApply={handleBeautyApply}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerRightContainer: {
    marginRight: 10,
  },
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFF9E6',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFD700',
    gap: 4,
  },
  coinIcon: {
    fontSize: 16,
  },
  coinText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D4AF37',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 28,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  resultActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0066FF',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  downloadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066FF',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  costBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  costBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
  },
  sectionDesc: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 20,
  },
  uploadButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  uploadIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  imagePreview: {
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
  },
  imageActions: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  reuploadButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  reuploadText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  beautyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  beautyButtonActive: {
    backgroundColor: '#3B82F6',
  },
  beautyButtonText: {
    color: '#3B82F6',
    fontSize: 13,
    fontWeight: '600',
  },
  beautyButtonTextActive: {
    color: '#FFFFFF',
  },
  resetBeautyButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  resetBeautyText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  templatesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  templateCard: {
    width: '31%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  templateCardSelected: {
    borderColor: '#0066FF',
    backgroundColor: '#EFF6FF',
  },
  templateIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  templateName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    textAlign: 'center',
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
  },
  showMoreButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  showMoreButtonIcon: {
    fontSize: 12,
    color: '#64748B',
  },
  resultContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  resultImage: {
    width: '100%',
    aspectRatio: 3 / 4,
  },
  generateButton: {
    backgroundColor: '#0066FF',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  generateButtonDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  generatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  modeButtonActive: {
    borderColor: '#0066FF',
    backgroundColor: '#F0F9FF',
  },
  modeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  modeButtonTextActive: {
    color: '#0066FF',
  },
  outfitImagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  outfitImageItem: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  outfitImagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeImageText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  addOutfitImageButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addOutfitImageIcon: {
    fontSize: 32,
    color: '#94A3B8',
  },
  addOutfitImageText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  imageCountText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
});
