import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Newspaper, Search, ShieldAlert, BookOpen, Clock, Tag, ChevronRight } from 'lucide-react';
import { KnowledgeArticle } from '../../types';
import { TriageBadge } from '../common/TriageBadge';
import { api } from '../../services/api';
import { CardsGridSkeleton } from '../common/LoadingSkeleton';

const DEFAULT_ARTICLE_IMAGE = 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&q=80&w=800';

function formatFriendlyDate(dateStr?: string, includeTime = false): string {
  if (!dateStr) return 'Mới cập nhật';
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

export const ArticlesNewsView: React.FC = () => {
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSpecies, setSelectedSpecies] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeArticle, setActiveArticle] = useState<KnowledgeArticle | null>(null);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const data = await api.getArticles();
      setArticles(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error loading articles:', e);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, []);

  const safeArticles = Array.isArray(articles) ? articles : [];

  const filtered = safeArticles.filter(art => {
    const matchesCategory = selectedCategory === 'all' || art.category === selectedCategory;
    const matchesSpecies = selectedSpecies === 'all' || art.species === selectedSpecies || art.species === 'Cả hai';
    const matchesSearch =
      (art.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (art.summary || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (art.symptoms || []).some(s => (s || '').toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesCategory && matchesSpecies && matchesSearch;
  });


  return (
    <div className="space-y-6">
      {/* Article Detail Page View */}
      {activeArticle ? (
        <div className="w-full space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <button
            onClick={() => setActiveArticle(null)}
            className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors font-bold text-sm bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-xs w-fit"
          >
            <span className="text-lg leading-none mt-[-2px]">←</span> Quay lại danh sách
          </button>

          <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="relative h-64 sm:h-80 w-full bg-slate-100">
              <img
                src={activeArticle.imageUrl || DEFAULT_ARTICLE_IMAGE}
                alt={activeArticle.title}
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src !== DEFAULT_ARTICLE_IMAGE) {
                    target.src = DEFAULT_ARTICLE_IMAGE;
                  }
                }}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="text-xs font-black px-3 py-1 rounded-full bg-black/70 text-white backdrop-blur-md shadow-md">
                  Dành cho {activeArticle.species}
                </span>
                <TriageBadge level={activeArticle.urgencyLevel} compact />
              </div>
            </div>

            <div className="p-5 sm:p-8 space-y-8">
              <div className="space-y-3">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                  {activeArticle.title}
                </h1>
                <p className="text-sm text-slate-500 font-medium">
                  Cập nhật lần cuối: {formatFriendlyDate(activeArticle.updatedAt, true)}
                </p>
              </div>

              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-sm space-y-3">
                <div className="flex items-center gap-2 font-black text-slate-900 text-base">
                  <span className="text-xl">🚨</span> Triệu Chứng Bệnh Cần Nhận Biết
                </div>
                <ul className="list-disc list-inside space-y-2 text-slate-700 pl-2">
                  {activeArticle.symptoms.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>

              <div className="p-5 bg-amber-50 rounded-2xl border border-amber-200 text-sm space-y-3">
                <div className="flex items-center gap-2 font-black text-amber-950 text-base">
                  <span className="text-xl">⚡</span> Các Bước Sơ Cứu Ban Đầu
                </div>
                <ol className="list-decimal list-inside space-y-2 text-amber-900 pl-2 font-medium">
                  {activeArticle.firstAidSteps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>

              <div className="p-5 bg-blue-50/80 rounded-2xl border border-blue-200 text-sm space-y-2">
                <div className="flex items-center gap-2 font-black text-blue-950 text-base">
                  <span className="text-xl">👨‍⚕️</span> Khuyên Dùng Từ Bác Sĩ Thú Y
                </div>
                <p className="text-blue-900 font-semibold leading-relaxed">
                  {activeArticle.doctorAdvice}
                </p>
              </div>

              <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-sm sm:text-base pt-4 border-t border-slate-100">
                <ReactMarkdown>{activeArticle.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Title */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                <Newspaper className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h2 className="text-xl font-bold text-slate-900">Tin Tức & Hướng Dẫn Sơ Cứu Khẩn Cấp</h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-700 border border-red-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    24/7
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Cơ sở dữ liệu bệnh lý, các bước sơ cứu khẩn cấp 24/7 chuẩn y khoa, phòng ngừa và chế độ dinh dưỡng cho Chó & Mèo.
                </p>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tra cứu tên bệnh, triệu chứng (vd: nôn mửa, Parvo, suy thận...)..."
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Category selector */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700"
            >
              <option value="all">📂 Tất cả danh mục</option>
              <option value="first_aid">🚨 Sơ cứu khẩn cấp (24/7)</option>
              <option value="symptom">🩺 Tra cứu triệu chứng</option>
              <option value="prevention">🛡️ Phòng bệnh & Vắc xin</option>
              <option value="nutrition">🥗 Dinh dưỡng khoa học</option>
            </select>

            {/* Species selector */}
            <select
              value={selectedSpecies}
              onChange={(e) => setSelectedSpecies(e.target.value)}
              className="text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700"
            >
              <option value="all">🐾 Tất cả loài</option>
              <option value="Chó">🐶 Dành cho Chó</option>
              <option value="Mèo">🐱 Dành cho Mèo</option>
            </select>
          </div>

          {/* Articles Grid */}
          {loading ? (
            <CardsGridSkeleton count={6} />
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">Không tìm thấy bài viết kiến thức nào phù hợp.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((art) => (
                <div
                  key={art.id}
                  onClick={() => setActiveArticle(art)}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-emerald-500 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <div className="relative h-44 overflow-hidden bg-slate-100">
                      <img
                        src={art.imageUrl || DEFAULT_ARTICLE_IMAGE}
                        alt={art.title}
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (target.src !== DEFAULT_ARTICLE_IMAGE) {
                            target.src = DEFAULT_ARTICLE_IMAGE;
                          }
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 left-3 flex gap-1.5">
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-xs">
                          {art.species}
                        </span>
                      </div>
                      <div className="absolute top-3 right-3">
                        <TriageBadge level={art.urgencyLevel} compact />
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2">
                        {art.title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-3">{art.summary}</p>
                    </div>
                  </div>

                  <div className="p-4 pt-0 border-t border-slate-100 mt-2 flex items-center justify-between text-xs font-semibold text-emerald-600">
                    <span className="flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Đọc kiến thức chi tiết →
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      {formatFriendlyDate(art.updatedAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
