import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react-native';
import type { VerificationHistory } from '@/types/verification';

interface ShareableVerificationResultProps {
  historyItem: VerificationHistory;
}

const ShareableVerificationResult = forwardRef<View, ShareableVerificationResultProps>(
  function ShareableVerificationResult({ historyItem }, ref) {
    const { result, request } = historyItem;
    const verdictConfig = getVerdictConfig(result.verdict, result.subjectType);

    return (
      <View ref={ref} style={styles.container} collapsable={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>真实性验证报告</Text>
          <Text style={styles.headerSubtitle}>Photo Authenticity Report</Text>
        </View>

        <View style={styles.scoreSection}>
          <View style={[styles.scoreCircle, { backgroundColor: verdictConfig.bgColor }]}>
            <Text style={[styles.scoreValue, { color: verdictConfig.color }]}>
              {formatScore(result.credibilityScore)}
            </Text>
            <Text style={[styles.scoreLabel, { color: verdictConfig.color }]}>可信度评分</Text>
          </View>
          
          <Text style={[styles.scoreTag, { color: getScoreTagConfig(result.credibilityScore).color }]}>
            {getScoreTagConfig(result.credibilityScore).label}
          </Text>
          
          <View style={[styles.verdictBadge, { backgroundColor: verdictConfig.badgeBg }]}>
            {verdictConfig.icon}
            <Text style={[styles.verdictText, { color: verdictConfig.color }]}>
              {verdictConfig.label}
            </Text>
          </View>

          <Text style={styles.verdictDescription}>{verdictConfig.description}</Text>
        </View>

        <View style={styles.imageSection}>
          <Text style={styles.sectionTitle}>验证照片</Text>
          <Image 
            source={{ uri: request.editedPhotoUri }}
            style={styles.verifiedImage}
            contentFit="contain"
            cachePolicy="memory-disk"
            priority="high"
          />
        </View>

        <View style={styles.analysisSection}>
          <Text style={styles.sectionTitle}>详细分析</Text>
          
          <View style={styles.analysisCard}>
            <AnalysisItem 
              label="特征相似度" 
              value={result.analysis.facialSimilarity} 
            />
            <AnalysisItem 
              label="纹理自然度" 
              value={result.analysis.skinTexture} 
            />
            <AnalysisItem 
              label="比例一致性" 
              value={result.analysis.proportions} 
            />
            <AnalysisItem 
              label="光照自然度" 
              value={result.analysis.lighting} 
              isLast
            />
          </View>
        </View>

        <View style={styles.referenceSection}>
          <Text style={styles.sectionTitle}>参考照片</Text>
          {request.referencePhotos.map(photo => (
            <View key={photo.id} style={styles.referenceItem}>
              <Image 
                source={{ uri: photo.uri }}
                style={styles.referenceImage}
                contentFit="contain"
                cachePolicy="memory-disk"
                priority="high"
              />
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerDate}>
            验证时间：{new Date(result.completedAt).toLocaleString('zh-CN')}
          </Text>
          <Text style={styles.footerBrand}>分析来源：验照神探</Text>
        </View>
      </View>
    );
  }
);

function AnalysisItem({ label, value, isLast }: { label: string; value: number; isLast?: boolean }) {
  return (
    <View style={[styles.analysisItem, isLast && { marginBottom: 0 }]}>
      <View style={styles.analysisHeader}>
        <Text style={styles.analysisLabel}>{label}</Text>
        <Text style={styles.analysisValue}>{value.toFixed(1)}%</Text>
      </View>
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill, 
            { width: `${value}%`, backgroundColor: getProgressColor(value) }
          ]} 
        />
      </View>
    </View>
  );
}

function formatScore(score: number): string {
  if (score % 1 === 0) {
    return `${score}/10`;
  }
  return `${score.toFixed(1)}/10`;
}

function getSubjectName(subjectType?: string): string {
  const subjectNames: Record<string, string> = {
    'person': '人物',
    'dog': '狗',
    'cat': '猫',
    'animal': '动物',
    'building': '建筑',
    'object': '物体',
    'other': '对象',
  };
  return subjectNames[subjectType || 'person'] || '对象';
}

function getVerdictConfig(verdict: string, subjectType?: string) {
  const subjectName = getSubjectName(subjectType);
  
  const configs: Record<string, any> = {
    'authentic': {
      label: '真实照片',
      description: `${subjectName}与参考照片高度一致，未发现明显修图痕迹`,
      color: '#15803D',
      bgColor: '#DCFCE7',
      badgeBg: '#BBF7D0',
      icon: <CheckCircle2 size={20} color="#15803D" />,
    },
    'slightly-edited': {
      label: '轻度修图',
      description: `${subjectName}照片有轻微修图，但整体与参考照片较为接近`,
      color: '#A16207',
      bgColor: '#FEF3C7',
      badgeBg: '#FDE68A',
      icon: <AlertTriangle size={20} color="#A16207" />,
    },
    'heavily-edited': {
      label: '重度修图',
      description: `${subjectName}照片修图程度较高，与参考照片有明显差异`,
      color: '#C2410C',
      bgColor: '#FED7AA',
      badgeBg: '#FCA5A5',
      icon: <AlertTriangle size={20} color="#C2410C" />,
    },
    'suspicious': {
      label: '可疑照片',
      description: `${subjectName}照片与参考照片差异显著，可能不是同一对象或高度修图`,
      color: '#DC2626',
      bgColor: '#FEE2E2',
      badgeBg: '#FECACA',
      icon: <XCircle size={20} color="#DC2626" />,
    },
  };
  return configs[verdict] || configs['suspicious'];
}

function getProgressColor(value: number): string {
  if (value >= 80) return '#15803D';
  if (value >= 60) return '#A16207';
  if (value >= 40) return '#C2410C';
  return '#DC2626';
}

function getScoreTagConfig(score: number) {
  if (score < 2) {
    return { label: '天差地别', color: '#DC2626' };
  } else if (score < 7.5) {
    return { label: '照骗', color: '#DC2626' };
  } else if (score < 9) {
    return { label: '轻微ps', color: '#CA8A04' };
  } else {
    return { label: '照片一致', color: '#15803D' };
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8FAFC',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  scoreSection: {
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
  },
  scoreCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  scoreValue: {
    fontSize: 40,
    fontWeight: '700',
    marginBottom: 8,
  },
  scoreTag: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  scoreLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  verdictBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 10,
  },
  verdictText: {
    fontSize: 15,
    fontWeight: '600',
  },
  verdictDescription: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  imageSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 12,
  },
  verifiedImage: {
    width: '100%',
    height: 400,
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
  },
  analysisSection: {
    marginBottom: 24,
  },
  analysisCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  analysisItem: {
    marginBottom: 16,
  },
  analysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  analysisLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  analysisValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  footer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  footerDate: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4,
  },
  footerBrand: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  referenceSection: {
    marginBottom: 24,
  },
  referenceItem: {
    marginBottom: 12,
  },
  referenceImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
  },
});

export default ShareableVerificationResult;
