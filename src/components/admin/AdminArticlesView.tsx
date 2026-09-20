import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Newspaper, Plus, Edit, Trash2, Search, Eye, X, Check,
  AlertTriangle, ShieldAlert, Sparkles, BookOpen, Clock, Tag,
  Bold, Italic, Heading2, Heading3, List, ListOrdered, Quote, Info, ChevronRight, FileText
} from 'lucide-react';
import type { KnowledgeArticle, TriageLevel } from '../../types';
import { api } from '../../services/api';
import { TriageBadge } from '../common/TriageBadge';
import { useNotification } from '../../contexts/NotificationContext';
import { CardsGridSkeleton } from '../common/LoadingSkeleton';

const DEFAULT_ARTICLE_IMAGE = 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&q=80&w=800';

export const AdminArticlesView: React.FC = () => {
  const { showSuccess, showError } = useNotification();
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'edit' | 'preview'>('edit');
  const [editingArticle, setEditingArticle] = useState<KnowledgeArticle | null>(null);
  const [articleToDelete, setClinicToDelete] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [species, setSpecies] = useState<'Chó' | 'Mèo' | 'Cả hai'>('Cả hai');
  const [category, setCategory] = useState<'symptom' | 'first_aid' | 'prevention' | 'nutrition'>('symptom');
  const [urgencyLevel, setUrgencyLevel] = useState<TriageLevel>('GREEN');
  const [summary, setSummary] = useState('');
  const [doctorAdvice, setDoctorAdvice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [content, setContent] = useState('');

  // Dynamic tags managers
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [newSymptom, setNewSymptom] = useState('');
  const [firstAidSteps, setFirstAidSteps] = useState<string[]>([]);
  const [newStep, setNewStep] = useState('');

  const loadArticles = async () => {
    setLoading(true);
    try {
      const data = await api.getArticles();
      setArticles(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error loading articles from DB:', e);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, []);

  const openAddModal = () => {
    setEditingArticle(null);
    setTitle('');
    setSpecies('Cả hai');
    setCategory('symptom');
    setUrgencyLevel('GREEN');
    setSummary('');
    setDoctorAdvice('');
    setImageUrl('');
    setContent(`## Tổng quan bệnh lý\n\nMô tả chi tiết nguyên nhân, diễn tiến của bệnh...\n\n### Hướng dẫn theo dõi và chăm sóc\n\n- Theo dõi nhiệt độ thú cưng\n- Đảm bảo uống đủ nước sạch\n- Không tự ý dùng thuốc người`);
    setSymptoms(['Biếng ăn', 'Ủ rũ']);
    setNewSymptom('');
    setFirstAidSteps(['Cách ly bé ở nơi yên tĩnh', 'Đo thân nhiệt']);
    setNewStep('');
    setModalTab('edit');
    setIsModalOpen(true);
  };

  const openEditModal = (art: KnowledgeArticle) => {
    setEditingArticle(art);
    setTitle(art.title || '');
    setSpecies(art.species || 'Cả hai');
    setCategory(art.category || 'symptom');
    setUrgencyLevel(art.urgencyLevel || 'GREEN');
    setSummary(art.summary || '');
    setDoctorAdvice(art.doctorAdvice || '');
    setImageUrl(art.imageUrl || '');
    setContent(art.content || '');
    setSymptoms(Array.isArray(art.symptoms) ? [...art.symptoms] : []);
    setNewSymptom('');
    setFirstAidSteps(Array.isArray(art.firstAidSteps) ? [...art.firstAidSteps] : []);
    setNewStep('');
    setModalTab('edit');
    setIsModalOpen(true);
  };

  // Symptoms tag helpers
  const handleAddSymptom = () => {
    if (newSymptom.trim() && !symptoms.includes(newSymptom.trim())) {
      setSymptoms([...symptoms, newSymptom.trim()]);
      setNewSymptom('');
    }
  };

  const handleRemoveSymptom = (idx: number) => {
    setSymptoms(symptoms.filter((_, i) => i !== idx));
  };

  // First Aid steps helpers
  const handleAddStep = () => {
    if (newStep.trim()) {
      setFirstAidSteps([...firstAidSteps, newStep.trim()]);
      setNewStep('');
    }
  };

  const handleRemoveStep = (idx: number) => {
    setFirstAidSteps(firstAidSteps.filter((_, i) => i !== idx));
  };

  // Markdown Formatting Toolbar Helpers
  const insertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('article-content-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end) || 'nội dung';
    const replacement = `${prefix}${selected}${suffix}`;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 50);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showError('Vui lòng nhập tiêu đề bài viết');
      return;
    }

    setSubmitting(true);
    const payload: Partial<KnowledgeArticle> = {
      title: title.trim(),
      species,
      category,
      urgencyLevel,
      summary: summary.trim(),
      doctorAdvice: doctorAdvice.trim(),
      imageUrl: imageUrl.trim() || DEFAULT_ARTICLE_IMAGE,
      content: content.trim(),
      symptoms,
      firstAidSteps
    };

    try {
      if (editingArticle) {
        await api.updateArticle(editingArticle.id, payload);
        showSuccess('Cập nhật bài viết y khoa thành công!');
      } else {
        await api.createArticle(payload);
        showSuccess('Thêm bài viết mới vào CSDL & RAG Vector thành công!');
      }
      setIsModalOpen(false);
      loadArticles();
    } catch (err: any) {
      showError(err.message || 'Lỗi lưu bài viết vào CSDL.');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!articleToDelete) return;
    try {
      await api.deleteArticle(articleToDelete);
      showSuccess('Đã xóa bài viết khỏi cơ sở dữ liệu!');
      loadArticles();
    } catch (err: any) {
      showError('Lỗi khi xóa bài viết.');
    } finally {
      setClinicToDelete(null);
    }
  };

  // Filtering
  const filteredArticles = articles.filter((a) => {
    const matchesCategory = selectedCategory === 'all' || a.category === selectedCategory;
    const matchesSearch =
      (a.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.summary || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.symptoms || []).some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
            <Newspaper className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">Quản Lý Bài Viết Y Khoa & Sơ Cứu 24/7</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
                {articles.length} bài viết (CSDL Supabase)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Hỗ trợ soạn thảo Markdown, quản lý checklist sơ cứu và xem trước giao diện người dùng.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm bài viết, triệu chứng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" /> Soạn Bài Mới
          </button>
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
        {[
          { id: 'all', label: 'Tất cả bài viết', count: articles.length },
          { id: 'first_aid', label: '🚨 Sơ cứu khẩn cấp (24/7)', count: articles.filter(a => a.category === 'first_aid').length },
          { id: 'symptom', label: '🩺 Tra cứu triệu chứng', count: articles.filter(a => a.category === 'symptom').length },
          { id: 'prevention', label: '🛡️ Phòng bệnh & Vắc xin', count: articles.filter(a => a.category === 'prevention').length },
          { id: 'nutrition', label: '🥗 Dinh dưỡng khoa học', count: articles.filter(a => a.category === 'nutrition').length },
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-colors flex items-center gap-1.5 shrink-0 ${
              selectedCategory === cat.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>{cat.label}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedCategory === cat.id ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-500'}`}>
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      {/* Articles Grid */}
      {loading ? (
        <CardsGridSkeleton count={4} />
      ) : filteredArticles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800 mb-1">
            {searchTerm ? 'Không tìm thấy bài viết phù hợp' : 'Chưa có bài viết nào trong danh mục này'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
            {searchTerm
              ? `Không tìm thấy kết quả khớp với "${searchTerm}". Hãy thử từ khóa khác.`
              : 'Hãy thêm bài viết đầu tiên để xây dựng cẩm nang y tế và cơ sở dữ liệu RAG cho AI.'}
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Soạn Bài Viết Mới
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredArticles.map((art) => (
            <div
              key={art.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:border-teal-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="relative h-44 w-full bg-slate-100">
                  <img
                    src={art.imageUrl || DEFAULT_ARTICLE_IMAGE}
                    alt={art.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DEFAULT_ARTICLE_IMAGE;
                    }}
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-black/70 text-white backdrop-blur-xs">
                      {art.species}
                    </span>
                    <TriageBadge level={art.urgencyLevel} compact />
                  </div>
                  {art.category === 'first_aid' && (
                    <span className="absolute bottom-3 right-3 text-[10px] font-black px-2 py-0.5 rounded-full bg-red-600 text-white shadow-md flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      SƠ CỨU 24/7
                    </span>
                  )}
                </div>

                <div className="p-4 space-y-2.5">
                  <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2" title={art.title}>
                    {art.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {art.summary || 'Chưa có tóm tắt ngắn cho bài viết.'}
                  </p>

                  {art.symptoms && art.symptoms.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {art.symptoms.slice(0, 3).map((s, idx) => (
                        <span key={idx} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                          {s}
                        </span>
                      ))}
                      {art.symptoms.length > 3 && (
                        <span className="text-[10px] text-slate-400 self-center">
                          +{art.symptoms.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {art.firstAidSteps && art.firstAidSteps.length > 0 && (
                    <div className="text-[11px] text-amber-700 bg-amber-50/80 px-2.5 py-1.5 rounded-xl border border-amber-200/60 flex items-center gap-1.5">
                      <span className="font-bold">⚡ {art.firstAidSteps.length} bước sơ cứu</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">
                  {art.updatedAt ? new Date(art.updatedAt).toLocaleDateString('vi-VN') : 'Mới tạo'}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(art)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5 text-slate-500" /> Sửa / Preview
                  </button>
                  <button
                    onClick={() => setClinicToDelete(art.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Xóa bài viết"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor & Preview Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-6 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-4xl w-full h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden relative">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-100 text-teal-700 rounded-xl">
                  <Newspaper className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingArticle ? 'Chỉnh Sửa Bài Viết & Phác Đồ' : 'Soạn Bài Viết Mới Cho RAG & Sơ Cứu'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Lưu trữ vào Supabase CSDL và tự động trích xuất vector embedding cho AI tư vấn.
                  </p>
                </div>
              </div>

              {/* Mode Toggle Tabs */}
              <div className="flex items-center gap-2">
                <div className="flex bg-slate-200 p-0.5 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setModalTab('edit')}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      modalTab === 'edit' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ✏️ Soạn Thảo
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalTab('preview')}
                    className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                      modalTab === 'preview' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" /> Xem Trước (Như User)
                  </button>
                </div>

                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6">
              {modalTab === 'edit' ? (
                <form id="article-editor-form" onSubmit={handleSubmit} className="space-y-4 text-xs">
                  {/* Title & Species & Category */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Tiêu đề bài viết y khoa *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Xử Trí Khẩn Cấp Khi Chó Bị Sốc Nhiệt Mùa Hè"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:border-teal-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Loài áp dụng</label>
                      <select
                        value={species}
                        onChange={(e) => setSpecies(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 font-medium focus:border-teal-500 focus:outline-hidden"
                      >
                        <option value="Cả hai">🐾 Cả hai (Chó & Mèo)</option>
                        <option value="Chó">🐶 Chó</option>
                        <option value="Mèo">🐱 Mèo</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Danh mục bài viết</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 font-medium focus:border-teal-500 focus:outline-hidden"
                      >
                        <option value="first_aid">🚨 Sơ cứu khẩn cấp (24/7)</option>
                        <option value="symptom">🩺 Tra cứu triệu chứng</option>
                        <option value="prevention">🛡️ Phòng bệnh & Vắc xin</option>
                        <option value="nutrition">🥗 Dinh dưỡng khoa học</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Mức độ cảnh báo Triage</label>
                      <select
                        value={urgencyLevel}
                        onChange={(e) => setUrgencyLevel(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 font-medium focus:border-teal-500 focus:outline-hidden"
                      >
                        <option value="GREEN">🟢 Xanh lá (GREEN - Nhẹ / Chăm sóc tại nhà)</option>
                        <option value="YELLOW">🟡 Vàng (YELLOW - Cần khám trong 24h)</option>
                        <option value="RED">🔴 Đỏ (RED - Cấp cứu khẩn cấp tối nguy)</option>
                      </select>
                    </div>
                  </div>

                  {/* Image URL */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Đường dẫn ảnh bìa (Image URL)</label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/photo-..."
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:border-teal-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Summary */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Tóm tắt ngắn (Summary hiển thị ngoài danh sách)</label>
                    <textarea
                      rows={2}
                      placeholder="Tóm tắt ngắn gọn triệu chứng và lưu ý quan trọng..."
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:border-teal-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Symptoms Tag Manager */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <label className="font-bold text-slate-800 block">🚨 Danh sách triệu chứng nhận biết</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Nhập triệu chứng (vd: Thở dốc, sùi bọt mép, nôn dịch vàng)..."
                        value={newSymptom}
                        onChange={(e) => setNewSymptom(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSymptom(); } }}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                      />
                      <button
                        type="button"
                        onClick={handleAddSymptom}
                        className="px-3 py-1.5 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-900"
                      >
                        Thêm
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {symptoms.map((s, i) => (
                        <span key={i} className="inline-flex items-center gap-1 text-[11px] bg-white border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg">
                          {s}
                          <button type="button" onClick={() => handleRemoveSymptom(i)} className="text-slate-400 hover:text-red-500">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* First Aid Steps Checklist Manager */}
                  <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 space-y-2">
                    <label className="font-bold text-amber-950 block">⚡ Các bước sơ cứu khẩn cấp ban đầu (Theo thứ tự)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Nhập bước sơ cứu tiếp theo..."
                        value={newStep}
                        onChange={(e) => setNewStep(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddStep(); } }}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-amber-200 bg-white"
                      />
                      <button
                        type="button"
                        onClick={handleAddStep}
                        className="px-3 py-1.5 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700"
                      >
                        Thêm bước
                      </button>
                    </div>

                    <ol className="list-decimal list-inside space-y-1.5 pt-1">
                      {firstAidSteps.map((step, i) => (
                        <li key={i} className="flex items-start justify-between gap-2 text-amber-950 font-medium bg-white p-2 rounded-lg border border-amber-100">
                          <span className="flex-1"><b className="text-amber-700">Bước {i + 1}:</b> {step}</span>
                          <button type="button" onClick={() => handleRemoveStep(i)} className="text-slate-400 hover:text-red-500">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Doctor Advice */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">👨‍⚕️ Lời khuyên của bác sĩ thú y (Doctor Advice)</label>
                    <textarea
                      rows={2}
                      placeholder="Lời dặn của chuyên gia y tế, cảnh báo thuốc chống chỉ định..."
                      value={doctorAdvice}
                      onChange={(e) => setDoctorAdvice(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:border-teal-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Markdown Content Editor with Toolbar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-700 block">Nội dung bài viết chi tiết (Định dạng Markdown)</label>
                      <span className="text-[10px] text-slate-400">Hỗ trợ Heading, Bullet, Bold, Tables</span>
                    </div>

                    {/* Format Toolbar */}
                    <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-100 rounded-t-xl border border-slate-200 border-b-0">
                      <button
                        type="button"
                        onClick={() => insertFormatting('**', '**')}
                        className="p-1.5 rounded hover:bg-white text-slate-700 font-bold"
                        title="In đậm (Bold)"
                      >
                        <Bold className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('*', '*')}
                        className="p-1.5 rounded hover:bg-white text-slate-700 italic"
                        title="In nghiêng (Italic)"
                      >
                        <Italic className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => insertFormatting('\n## ', '\n')}
                        className="px-2 py-1 rounded hover:bg-white text-slate-700 font-bold text-[11px]"
                        title="Tiêu đề H2"
                      >
                        H2
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('\n### ', '\n')}
                        className="px-2 py-1 rounded hover:bg-white text-slate-700 font-bold text-[11px]"
                        title="Tiêu đề H3"
                      >
                        H3
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => insertFormatting('\n- ', '\n')}
                        className="p-1.5 rounded hover:bg-white text-slate-700"
                        title="Danh sách gạch đầu dòng"
                      >
                        <List className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('\n1. ', '\n')}
                        className="p-1.5 rounded hover:bg-white text-slate-700"
                        title="Danh sách có số thứ tự"
                      >
                        <ListOrdered className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => insertFormatting('\n> **Lưu ý y tế:** ', '\n')}
                        className="p-1.5 rounded hover:bg-white text-slate-700"
                        title="Khối trích dẫn lưu ý"
                      >
                        <Quote className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('\n| Triệu chứng | Cách xử lý |\n| --- | --- |\n| ', ' | |\n')}
                        className="px-2 py-1 rounded hover:bg-white text-slate-700 text-[11px]"
                        title="Chèn bảng dữ liệu"
                      >
                        📊 Bảng
                      </button>
                    </div>

                    <textarea
                      id="article-content-editor"
                      rows={10}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Nhập nội dung bài viết định dạng Markdown..."
                      className="w-full px-3.5 py-3 rounded-b-xl border border-slate-200 font-mono text-xs text-slate-900 leading-relaxed focus:border-teal-500 focus:outline-hidden"
                    />
                  </div>
                </form>
              ) : (
                /* User-like Preview Tab */
                <div className="space-y-6 max-w-3xl mx-auto pb-6 animate-in fade-in duration-150">
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2">
                    <Info className="w-4 h-4 text-amber-600 shrink-0" />
                    <span><b>Chế độ xem trước (Preview):</b> Đây là giao diện chính xác mà người dùng sẽ thấy khi truy cập bài viết này trên hệ thống.</span>
                  </div>

                  <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
                    <div className="relative h-64 sm:h-72 w-full bg-slate-100">
                      <img
                        src={imageUrl || DEFAULT_ARTICLE_IMAGE}
                        alt={title || 'Xem trước'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = DEFAULT_ARTICLE_IMAGE;
                        }}
                      />
                      <div className="absolute top-4 left-4 flex gap-2">
                        <span className="text-xs font-black px-3 py-1 rounded-full bg-black/70 text-white backdrop-blur-md shadow-md">
                          Dành cho {species}
                        </span>
                        <TriageBadge level={urgencyLevel} compact />
                      </div>
                      {category === 'first_aid' && (
                        <span className="absolute top-4 right-4 text-xs font-black px-3 py-1 rounded-full bg-red-600 text-white shadow-md flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                          SƠ CỨU 24/7
                        </span>
                      )}
                    </div>

                    <div className="p-6 sm:p-8 space-y-6">
                      <div className="space-y-2">
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                          {title || 'Tiêu đề bài viết y khoa xem trước'}
                        </h1>
                        <p className="text-xs text-slate-500">
                          Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')} • Cơ sở dữ liệu Vethic AI
                        </p>
                      </div>

                      {/* Symptoms Box */}
                      {symptoms.length > 0 && (
                        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-sm space-y-2.5">
                          <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
                            <span className="text-lg">🚨</span> Triệu Chứng Bệnh Cần Nhận Biết
                          </div>
                          <ul className="list-disc list-inside space-y-1.5 text-slate-700 pl-2 text-xs">
                            {symptoms.map((s, i) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* First Aid Steps Box */}
                      {firstAidSteps.length > 0 && (
                        <div className="p-5 bg-amber-50 rounded-2xl border border-amber-200 text-sm space-y-2.5">
                          <div className="flex items-center gap-2 font-black text-amber-950 text-sm">
                            <span className="text-lg">⚡</span> Các Bước Sơ Cứu Ban Đầu
                          </div>
                          <ol className="list-decimal list-inside space-y-1.5 text-amber-900 pl-2 font-medium text-xs">
                            {firstAidSteps.map((step, i) => (
                              <li key={i}>{step}</li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {/* Doctor Advice */}
                      {doctorAdvice && (
                        <div className="p-5 bg-blue-50/80 rounded-2xl border border-blue-200 text-sm space-y-1.5">
                          <div className="flex items-center gap-2 font-black text-blue-950 text-sm">
                            <span className="text-lg">👨‍⚕️</span> Khuyên Dùng Từ Bác Sĩ Thú Y
                          </div>
                          <p className="text-blue-900 font-semibold leading-relaxed text-xs">
                            {doctorAdvice}
                          </p>
                        </div>
                      )}

                      {/* Markdown Content */}
                      <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-sm pt-4 border-t border-slate-100">
                        <ReactMarkdown>{content || '*Chưa có nội dung chi tiết.*'}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                {modalTab === 'edit' ? (
                  <span>Đang ở chế độ soạn thảo</span>
                ) : (
                  <span>Đang ở chế độ xem trước (Preview)</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  form="article-editor-form"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting ? 'Đang lưu vào CSDL...' : 'Lưu Bài Viết Vào CSDL'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {articleToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-center text-slate-900 mb-2">Xóa Bài Viết Y Khoa</h3>
            <p className="text-xs text-center text-slate-500 mb-6">
              Bạn có chắc chắn muốn xóa bài viết này khỏi cơ sở dữ liệu? Dữ liệu RAG và embedding tương ứng sẽ bị xóa vĩnh viễn.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setClinicToDelete(null)}
                className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                Xóa ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
