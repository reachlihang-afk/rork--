import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { X, Search, Hash } from 'lucide-react-native';
import { useTopic } from '@/contexts/TopicContext';

interface TopicSelectorProps {
  selectedTopics: string[];        // 已选话题ID数组
  onTopicsChange: (topics: string[]) => void;
  maxTopics?: number;              // 最多选择数量
}

export function TopicSelector({ 
  selectedTopics, 
  onTopicsChange, 
  maxTopics = 5 
}: TopicSelectorProps) {
  const { hotTopics, getTopic, searchTopics, createTopic } = useTopic();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // 搜索结果
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchTopics(searchQuery);
  }, [searchQuery, searchTopics]);

  // 切换话题选择
  const toggleTopic = (topicId: string) => {
    if (selectedTopics.includes(topicId)) {
      // 取消选择
      onTopicsChange(selectedTopics.filter(id => id !== topicId));
    } else {
      // 添加选择
      if (selectedTopics.length >= maxTopics) {
        return; // 已达上限
      }
      onTopicsChange([...selectedTopics, topicId]);
    }
  };

  // 创建新话题
  const handleCreateTopic = async () => {
    const cleanName = searchQuery.trim().replace('#', '');
    if (!cleanName) return;
    
    try {
      const newTopic = await createTopic(cleanName);
      toggleTopic(newTopic.id);
      setSearchQuery('');
    } catch (error) {
      console.error('Failed to create topic:', error);
    }
  };

  // 移除已选话题
  const removeTopic = (topicId: string) => {
    onTopicsChange(selectedTopics.filter(id => id !== topicId));
  };

  return (
    <View style={styles.container}>
      {/* 搜索框 */}
      <View style={styles.searchContainer}>
        <Search size={18} color="#94a3b8" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="搜索或创建话题"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={() => setIsSearching(true)}
          placeholderTextColor="#94a3b8"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X size={18} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </View>

      {/* 搜索结果或热门话题 */}
      {isSearching && searchQuery.trim().length > 0 ? (
        <View style={styles.searchResults}>
          {searchResults.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>搜索结果</Text>
              {searchResults.map(topic => (
                <TouchableOpacity
                  key={topic.id}
                  style={[
                    styles.topicItem,
                    selectedTopics.includes(topic.id) && styles.topicItemSelected
                  ]}
                  onPress={() => toggleTopic(topic.id)}
                >
                  <View style={styles.topicItemLeft}>
                    <Hash size={16} color={selectedTopics.includes(topic.id) ? '#22c55e' : '#64748b'} />
                    <Text style={[
                      styles.topicItemName,
                      selectedTopics.includes(topic.id) && styles.topicItemNameSelected
                    ]}>
                      {topic.name}
                    </Text>
                  </View>
                  <Text style={styles.topicItemCount}>{topic.postsCount}条</Text>
                </TouchableOpacity>
              ))}
            </>
          ) : (
            <TouchableOpacity 
              style={styles.createTopic}
              onPress={handleCreateTopic}
            >
              <Hash size={16} color="#22c55e" />
              <Text style={styles.createTopicText}>
                创建话题 "<Text style={styles.createTopicName}>#{searchQuery.replace('#', '')}</Text>"
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <>
          {/* 热门话题快速选择 */}
          <Text style={styles.sectionTitle}>热门话题</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.hotTopicsScroll}
          >
            {hotTopics.map(topic => (
              <TouchableOpacity
                key={topic.id}
                onPress={() => toggleTopic(topic.id)}
                style={[
                  styles.topicChip,
                  selectedTopics.includes(topic.id) && styles.topicChipSelected
                ]}
              >
                <Text style={[
                  styles.topicChipText,
                  selectedTopics.includes(topic.id) && styles.topicChipTextSelected
                ]}>
                  {topic.nameWithHash}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}

      {/* 已选话题 */}
      {selectedTopics.length > 0 && (
        <View style={styles.selectedSection}>
          <Text style={styles.selectedTitle}>
            已选话题 ({selectedTopics.length}/{maxTopics})
          </Text>
          <View style={styles.selectedChips}>
            {selectedTopics.map(id => {
              const topic = getTopic(id);
              if (!topic) return null;
              return (
                <View key={id} style={styles.selectedChip}>
                  <Text style={styles.selectedChipText}>{topic.nameWithHash}</Text>
                  <TouchableOpacity onPress={() => removeTopic(id)}>
                    <X size={14} color="#22c55e" />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchIcon: {
    marginRight: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1e293b',
    padding: 0,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  hotTopicsScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  topicChip: {
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  topicChipSelected: {
    backgroundColor: '#f0fdf4',
    borderColor: '#22c55e',
  },
  topicChipText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  topicChipTextSelected: {
    color: '#16a34a',
  },
  searchResults: {
    gap: 8,
  },
  topicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  topicItemSelected: {
    backgroundColor: '#f0fdf4',
    borderColor: '#22c55e',
  },
  topicItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topicItemName: {
    fontSize: 15,
    color: '#1e293b',
    fontWeight: '500',
  },
  topicItemNameSelected: {
    color: '#16a34a',
  },
  topicItemCount: {
    fontSize: 13,
    color: '#94a3b8',
  },
  createTopic: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  createTopicText: {
    fontSize: 14,
    color: '#64748b',
  },
  createTopicName: {
    color: '#16a34a',
    fontWeight: '600',
  },
  selectedSection: {
    gap: 8,
  },
  selectedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  selectedChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdf4',
    borderRadius: 16,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  selectedChipText: {
    fontSize: 14,
    color: '#16a34a',
    fontWeight: '500',
  },
});
