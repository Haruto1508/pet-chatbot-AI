import React, { useState, useEffect } from 'react';
import { Database, Plus, Edit, Trash2, Search, BookOpen, Image as ImageIcon, X, RefreshCw } from 'lucide-react';
import { KnowledgeArticle, TriageLevel } from '../../types';
import { TriageBadge } from '../common/TriageBadge';
import { api } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

export const AdminKnowledgeRAGView: React.FC = () => {
  const { showSuccess, showError } = useNotification();
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<KnowledgeArticle | null>(null);
  const [articleToDelete, setArticleToDelete] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    species: 'Cả hai' as 'Chó' | 'Mèo' | 'Cả hai',
    category: 'symptom' as 'symptom' | 'first_aid' | 'prevention' | 'nutrition',
    summary: '',
    symptoms: '',
    firstAidSteps: '',
    doctorAdvice: '',
    urgencyLevel: 'RED' as TriageLevel,
    imageUrl: '',
    content: ''
  });

  const loadArticles = async () => {
    setLoading(true);
    try {
      const data = await api.getArticles();
      setArticles(data);
    } catch (e) {
      console.error('Error loading articles:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, []);

  const openAddModal = () => {
    setEditingArticle(null);
    setFormData({
      title: '',
      species: 'Cả hai',
      category: 'symptom',
      summary: '',
      symptoms: 'Nôn mửa, Lờ đờ, Bỏ ăn',
      firstAidSteps: 'Cách ly thú cưng, Giữ ấm, Đưa đi thú y',
      doctorAdvice: 'Theo dõi chỉ số sinh hiệu và truyền dịch cấp cứu.',
      urgencyLevel: 'RED',
      imageUrl: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&q=80&w=600',
      content: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (art: KnowledgeArticle) => {
    setEditingArticle(art);
    setFormData({
      title: art.title,
      species: art.species,
      category: art.category,
      summary: art.summary,
      symptoms: art.symptoms.join(', '),
      firstAidSteps: art.firstAidSteps.join(', '),
      doctorAdvice: art.doctorAdvice,
      urgencyLevel: art.urgencyLevel,
      imageUrl: art.imageUrl,
      content: art.content
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const symptomList = formData.symptoms.split(',').map(s => s.trim()).filter(Boolean);
    const stepList = formData.firstAidSteps.split(',').map(s => s.trim()).filter(Boolean);

    const payload = {
      title: formData.title,
      species: formData.species,
      category: formData.category,
      summary: formData.summary,
      symptoms: symptomList,
      firstAidSteps: stepList,
      doctorAdvice: formData.doctorAdvice,
      urgencyLevel: formData.urgencyLevel,
      imageUrl: formData.imageUrl || 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&q=80&w=600',
      content: formData.content
    };

    setIsSubmitting(true);
    try {
      if (editingArticle) {
        await api.updateArticle(editingArticle.id, payload);
        showSuccess('Đã cập nhật bài viết và đồng bộ Vector RAG thành công!');
      } else {
        await api.createArticle(payload);
        showSuccess('Đã tạo mới bài viết và nhúng Vector RAG thành công!');
      }

      setIsModalOpen(false);
      loadArticles();
    } catch (err: any) {
      showError(err?.message || 'Lỗi khi lưu bài viết RAG');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    setArticleToDelete(id);
  };

  const confirmDelete = async () => {
    if (!articleToDelete) return;
    try {
      await api.deleteArticle(articleToDelete);
      showSuccess('Đã xóa bài viết kiến thức!');
      loadArticles();
    } catch (e) {
      showError('Lỗi khi xóa bài viết.');
    } finally {
      setArticleToDelete(null);
    }
  };

  const filtered = articles.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.summary.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Quản Lý Kiến Thức Bệnh Thú Cưng (RAG Data)</h2>
            <p className="text-xs text-slate-500">
              Quản lý tài liệu bệnh lý, cách sơ cứu và hình ảnh huấn luyện để Gemini AI học và truy xuất RAG.
            </p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs"
        >
          <Plus className="w-4 h-4" /> Thêm Bài Viết RAG
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm bài viết tri thức..."
          className="w-full text-xs pl-10 pr-3 py-3 rounded-xl border border-slate-200 bg-white"
        />
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="text-center py-12 text-slate-500 text-xs col-span-2">Đang tải...</div>
        ) : (
          filtered.map((art) => (
            <div key={art.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {art.species}
                    </span>
                    <TriageBadge level={art.urgencyLevel} compact />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">{art.title}</h3>
                </div>
              </div>

              <p className="text-xs text-slate-500 line-clamp-2">{art.summary}</p>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Danh mục: {art.category}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(art)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 font-semibold text-slate-700"
                  >
                    <Edit className="w-3.5 h-3.5" /> Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(art.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit RAG Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 relative my-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-4">
              {editingArticle ? 'Chỉnh Sửa Dữ Liệu RAG' : 'Thêm Bài Viết Kiến Thức RAG Mới'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tiêu đề bài viết y khoa</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Loài áp dụng</label>
                  <select
                    value={formData.species}
                    onChange={(e) => setFormData({ ...formData, species: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold"
                  >
                    <option value="Chó">Chó</option>
                    <option value="Mèo">Mèo</option>
                    <option value="Cả hai">Cả hai</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mức nguy hiểm</label>
                  <select
                    value={formData.urgencyLevel}
                    onChange={(e) => setFormData({ ...formData, urgencyLevel: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold text-red-700"
                  >
                    <option value="RED">🔴 Khẩn cấp (Đỏ)</option>
                    <option value="YELLOW">🟡 Theo dõi (Vàng)</option>
                    <option value="GREEN">🟢 An toàn (Xanh)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Danh mục</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold"
                  >
                    <option value="symptom">🩺 Triệu chứng</option>
                    <option value="first_aid">🚨 Sơ cứu khẩn cấp</option>
                    <option value="prevention">🛡️ Phòng bệnh</option>
                    <option value="nutrition">🥗 Dinh dưỡng</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tóm tắt nội dung</label>
                <textarea
                  rows={2}
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Danh sách triệu chứng (phân cách bởi dấu phẩy)</label>
                <input
                  type="text"
                  value={formData.symptoms}
                  onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Các bước sơ cứu (phân cách bởi dấu phẩy)</label>
                <input
                  type="text"
                  value={formData.firstAidSteps}
                  onChange={(e) => setFormData({ ...formData, firstAidSteps: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Lời khuyên Bác sĩ Thú y</label>
                <input
                  type="text"
                  value={formData.doctorAdvice}
                  onChange={(e) => setFormData({ ...formData, doctorAdvice: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">URL Ảnh minh họa cho AI học</label>
                <input
                  type="text"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nội dung chuyên môn đầy đủ (RAG Context)</label>
                <textarea
                  rows={5}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Đang tạo Vector RAG...
                    </>
                  ) : (
                    'Lưu RAG Data'
                  )}
                </button>
              </div>
            </form>
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
            <h3 className="text-lg font-bold text-center text-slate-900 mb-2">Xóa Kiến Thức</h3>
            <p className="text-sm text-center text-slate-500 mb-6">
              Bạn có chắc chắn muốn xóa bài viết kiến thức này? Hành động này không thể hoàn tác và có thể làm AI mất dữ liệu tham khảo (RAG).
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setArticleToDelete(null)}
                className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors shadow-xs"
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
