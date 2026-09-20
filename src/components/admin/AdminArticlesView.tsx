import React, { useState, useEffect, useMemo } from 'react';
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

function formatFriendlyDate(dateStr?: string, includeTime = false): string {
  if (!dateStr) return 'Mới tạo';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    if (!includeTime) {
      return `${day}/${month}/${year}`;
    }
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} lúc ${hours}:${minutes}`;
  } catch {
    return dateStr;
  }
}

// ---------------------------------------------------------------------------
// Isolated ArticleEditorModal: Keeps local form state so typing in Markdown
// textarea or inputs never triggers a parent re-render (Zero Input Lag)
// ---------------------------------------------------------------------------
interface ArticleEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingArticle: KnowledgeArticle | null;
  onSave: (payload: Partial<KnowledgeArticle>) => Promise<void>;
  submitting: boolean;
}

const ArticleEditorModal: React.FC<ArticleEditorModalProps> = ({
  isOpen,
  onClose,
  editingArticle,
  onSave,
  submitting,
}) => {
  const [modalTab, setModalTab] = useState<'edit' | 'preview'>('edit');
  const [title, setTitle] = useState('');
  const [species, setSpecies] = useState<'Chó' | 'Mèo' | 'Cả hai'>('Cả hai');
  const [category, setCategory] = useState<'symptom' | 'first_aid' | 'prevention' | 'nutrition'>('symptom');
  const [urgencyLevel, setUrgencyLevel] = useState<TriageLevel>('GREEN');
  const [summary, setSummary] = useState('');
  const [doctorAdvice, setDoctorAdvice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [content, setContent] = useState('');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [newSymptom, setNewSymptom] = useState('');
  const [firstAidSteps, setFirstAidSteps] = useState<string[]>([]);
  const [newStep, setNewStep] = useState('');

  useEffect(() => {
    if (isOpen) {
      setModalTab('edit');
      if (editingArticle) {
        setTitle(editingArticle.title || '');
        setSpecies(editingArticle.species || 'Cả hai');
        setCategory(editingArticle.category || 'symptom');
        setUrgencyLevel(editingArticle.urgencyLevel || 'GREEN');
        setSummary(editingArticle.summary || '');
        setDoctorAdvice(editingArticle.doctorAdvice || '');
        setImageUrl(editingArticle.imageUrl || '');
        setContent(editingArticle.content || '');
        setSymptoms(Array.isArray(editingArticle.symptoms) ? [...editingArticle.symptoms] : []);
        setFirstAidSteps(Array.isArray(editingArticle.firstAidSteps) ? [...editingArticle.firstAidSteps] : []);
      } else {
        setTitle('');
        setSpecies('Cả hai');
        setCategory('symptom');
        setUrgencyLevel('GREEN');
        setSummary('');
        setDoctorAdvice('');
        setImageUrl('');
        setContent(`## Tổng quan bệnh lý\n\nMô tả chi tiết nguyên nhân, diễn tiến của bệnh...\n\n### Hướng dẫn theo dõi và chăm sóc\n\n- Theo dõi nhiệt độ thú cưng\n- Đảm bảo uống đủ nước sạch\n- Không tự ý dùng thuốc người`);
        setSymptoms(['Biếng ăn', 'Ủ rũ']);
        setFirstAidSteps(['Cách ly bé ở nơi yên tĩnh', 'Đo thân nhiệt']);
      }
      setNewSymptom('');
      setNewStep('');
    }
  }, [isOpen, editingArticle]);

  if (!isOpen) return null;

  // Symptom tags helpers
  const handleAddSymptom = () => {
    const trimmed = newSymptom.trim();
    if (trimmed && !symptoms.includes(trimmed)) {
      setSymptoms([...symptoms, trimmed]);
      setNewSymptom('');
    }
  };

  const handleRemoveSymptom = (idx: number) => {
    setSymptoms(symptoms.filter((_, i) => i !== idx));
  };

  // First Aid steps helpers
  const handleAddStep = () => {
    const trimmed = newStep.trim();
    if (trimmed) {
      setFirstAidSteps([...firstAidSteps, trimmed]);
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
    }, 30);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      title: title.trim(),
      species,
      category,
      urgencyLevel,
      summary: summary.trim(),
      doctorAdvice: doctorAdvice.trim(),
      imageUrl: imageUrl.trim() || DEFAULT_ARTICLE_IMAGE,
      content: content.trim(),
      symptoms,
      firstAidSteps,
    });
  };

  return (
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
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {modalTab === 'edit' ? (
            <form id="article-editor-form" onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              {/* Title */}
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

              {/* Species, Category, Urgency */}
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
                    <option value="symptom">🩺 Bệnh lý & Triệu chứng</option>
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
                <label className="font-bold text-slate-700 block mb-1">Tóm tắt ngắn (Dành cho hiển thị trên thẻ card)</label>
                <textarea
                  rows={2}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Tóm tắt 1-2 câu về nội dung bài viết..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:border-teal-500 focus:outline-hidden"
                />
              </div>

              {/* Symptoms Tags */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tags Triệu Chứng Nhận Biết</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newSymptom}
                    onChange={(e) => setNewSymptom(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSymptom();
                      }
                    }}
                    placeholder="Nhập triệu chứng rồi bấm Thêm (ví dụ: sốt cao, nôn mửa...)"
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-800 focus:border-teal-500 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleAddSymptom}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 rounded-xl transition-colors"
                  >
                    + Thêm tag
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {symptoms.map((s, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 font-medium text-xs"
                    >
                      {s}
                      <button
                        type="button"
                        onClick={() => handleRemoveSymptom(idx)}
                        className="text-teal-600 hover:text-red-500 font-bold ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* First Aid Steps Checklist */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Các Bước Sơ Cứu Ban Đầu (Theo Thứ Tự)</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newStep}
                    onChange={(e) => setNewStep(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddStep();
                      }
                    }}
                    placeholder="Nhập bước sơ cứu rồi bấm Thêm..."
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-800 focus:border-teal-500 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleAddStep}
                    className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 font-bold text-amber-900 rounded-xl transition-colors"
                  >
                    + Thêm bước
                  </button>
                </div>
                <div className="space-y-1.5">
                  {firstAidSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-950"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 font-black text-[10px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-medium">{step}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveStep(idx)}
                        className="text-slate-400 hover:text-red-600 font-bold px-2 py-0.5"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Doctor Advice */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Lời khuyên chuyên môn từ Bác Sĩ Thú Y</label>
                <textarea
                  rows={2}
                  value={doctorAdvice}
                  onChange={(e) => setDoctorAdvice(e.target.value)}
                  placeholder="Khuyến nghị y khoa chính xác từ bác sĩ..."
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
                    <p className="text-xs text-slate-500 font-medium">
                      Cập nhật: {formatFriendlyDate(new Date().toISOString(), true)} • Cơ sở dữ liệu Vethic AI
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
              onClick={onClose}
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
  );
};

// ---------------------------------------------------------------------------
// Main AdminArticlesView Component
// ---------------------------------------------------------------------------
export const AdminArticlesView: React.FC = () => {
  const { showSuccess, showError } = useNotification();
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Modal and Delete states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<KnowledgeArticle | null>(null);
  const [articleToDelete, setArticleToDelete] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    setIsModalOpen(true);
  };

  const openEditModal = (art: KnowledgeArticle) => {
    setEditingArticle(art);
    setIsModalOpen(true);
  };

  const handleSaveArticle = async (payload: Partial<KnowledgeArticle>) => {
    if (!payload.title?.trim()) {
      showError('Vui lòng nhập tiêu đề bài viết');
      return;
    }

    setSubmitting(true);
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
      setArticleToDelete(null);
    }
  };

  // Memoized Category Counts
  const categoryCounts = useMemo(() => ({
    all: articles.length,
    first_aid: articles.filter((a) => a.category === 'first_aid').length,
    symptom: articles.filter((a) => a.category === 'symptom').length,
    prevention: articles.filter((a) => a.category === 'prevention').length,
    nutrition: articles.filter((a) => a.category === 'nutrition').length,
  }), [articles]);

  // Memoized Filtering (Never re-filters while typing in modal)
  const filteredArticles = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return articles.filter((a) => {
      const matchesCategory = selectedCategory === 'all' || a.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!q) return true;
      return (
        (a.title || '').toLowerCase().includes(q) ||
        (a.summary || '').toLowerCase().includes(q) ||
        (a.symptoms || []).some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [articles, selectedCategory, searchTerm]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
            <Newspaper className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-black text-slate-900">Quản Lý Bài Viết & Hướng Dẫn Sơ Cứu 24/7</h1>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                CRUD & Markdown
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Quản lý cẩm nang bệnh lý, quy trình sơ cứu khẩn cấp, cập nhật kho tri thức RAG cho AI.
            </p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" /> Soạn Bài Viết Mới
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tiêu đề, tóm tắt hoặc triệu chứng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 focus:border-teal-500 focus:outline-hidden"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Categories Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'all', label: 'Tất cả bài viết', count: categoryCounts.all },
          { id: 'first_aid', label: '🚨 Sơ cứu khẩn cấp 24/7', count: categoryCounts.first_aid },
          { id: 'symptom', label: '🩺 Tra cứu triệu chứng', count: categoryCounts.symptom },
          { id: 'prevention', label: '🛡️ Phòng bệnh & Vắc xin', count: categoryCounts.prevention },
          { id: 'nutrition', label: '🥗 Dinh dưỡng khoa học', count: categoryCounts.nutrition },
        ].map((cat) => (
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
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedCategory === cat.id ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-500'
              }`}
            >
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
                  {formatFriendlyDate(art.updatedAt)}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(art)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5 text-slate-500" /> Sửa / Preview
                  </button>
                  <button
                    onClick={() => setArticleToDelete(art.id)}
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

      {/* Editor & Preview Modal (Isolated State Component) */}
      <ArticleEditorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingArticle={editingArticle}
        onSave={handleSaveArticle}
        submitting={submitting}
      />

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
                onClick={() => setArticleToDelete(null)}
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
