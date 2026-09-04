/*
  [참고] Supabase SQL Editor에서 실행해야 하는 DB 컬럼 추가 코드 (테마 및 스탬프):
  alter table letters add column if not exists theme text default 'pink';
  alter table letters add column if not exists stamp_type text default '💌';
*/

"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";

interface Reply {
  id: string;
  sender_name: string;
  message: string;
  stamp_type: string;
  created_at: string;
}

interface Letter {
  id: string;
  title: string;
  content: string;
  theme?: string;
  stamp_type?: string;
  created_at: string;
  replies?: Reply[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [nickname, setNickname] = useState("");
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [newNickname, setNewNickname] = useState("");
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [passcode, setPasscode] = useState("");
  const [passcodeHint, setPasscodeHint] = useState("");
  
  // 🎨 테마 및 스탬프 선택 상태
  const [theme, setTheme] = useState("pink");
  const [stampType, setStampType] = useState("💌");

  const [createdLink, setCreatedLink] = useState("");

  const [letters, setLetters] = useState<Letter[]>([]);
  const [loadingLetters, setLoadingLetters] = useState(true);

  useEffect(() => {
    const checkUserAndFetchData = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push("/login");
        return;
      }
      const currentUser = data.session.user;
      setUser(currentUser);

      const savedNickname = currentUser.user_metadata?.nickname || currentUser.email?.split("@")[0] || "사용자";
      setNickname(savedNickname);
      setNewNickname(savedNickname);

      const { data: lettersData, error } = await supabase
        .from("letters")
        .select(`
          *,
          replies (
            id,
            sender_name,
            message,
            stamp_type,
            created_at
          )
        `)
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false });

      if (!error && lettersData) {
        setLetters(lettersData);
      }
      setLoadingLetters(false);
    };

    checkUserAndFetchData();
  }, [router]);

  if (!user) return <div className="p-10 text-center">로딩 중...</div>;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleUpdateNickname = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNickname.trim()) {
      alert("닉네임을 입력해주세요!");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      data: { nickname: newNickname }
    });

    if (error) {
      alert("닉네임 변경 실패: " + error.message);
    } else {
      setNickname(newNickname);
      setIsEditingNickname(false);
      alert("닉네임이 성공적으로 변경되었습니다!");
    }
  };

  const handleCreateLetter = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !content || !passcode) {
      alert("제목, 내용, 비밀번호를 모두 입력해주세요!");
      return;
    }

    const { data, error } = await supabase
      .from("letters")
      .insert([
        {
          user_id: user.id,
          sender_name: nickname,
          title,
          content,
          passcode,
          passcode_hint: passcodeHint,
          theme,
          stamp_type: stampType,
        },
      ])
      .select()
      .single();

    if (error) {
      alert("편지 저장 실패: " + error.message);
    } else {
      const link = `${window.location.origin}/l/${data.id}`;
      setCreatedLink(link);
      alert("편지가 성공적으로 생성되었습니다!");
      setTitle("");
      setContent("");
      setPasscode("");
      setPasscodeHint("");

      setLetters([ { ...data, replies: [] }, ...letters ]);
    }
  };

  // 🎨 테마별 스타일 정의 헬퍼
  const getThemeStyles = (selectedTheme: string) => {
    switch (selectedTheme) {
      case "dark":
        return {
          container: "bg-gray-900 border-gray-800 text-white",
          card: "bg-gray-800 border-gray-700 text-white",
          previewBox: "bg-gray-900/50 text-gray-200 border-gray-700",
          tag: "bg-gray-700 text-gray-200",
          titleColor: "text-white",
        };
      case "beige":
        return {
          container: "bg-amber-50/70 border-amber-100 text-amber-950",
          card: "bg-amber-100/60 border-amber-200 text-amber-950",
          previewBox: "bg-amber-50/80 text-amber-900 border-amber-200",
          tag: "bg-amber-200 text-amber-800",
          titleColor: "text-amber-950",
        };
      case "lavender":
        return {
          container: "bg-purple-50/60 border-purple-100 text-purple-950",
          card: "bg-white border-purple-100 text-purple-950",
          previewBox: "bg-purple-50/40 text-purple-900 border-purple-100",
          tag: "bg-purple-200 text-purple-800",
          titleColor: "text-purple-950",
        };
      default: // pink
        return {
          container: "bg-pink-50/60 border-pink-100 text-gray-900",
          card: "bg-white border-pink-100 text-gray-900",
          previewBox: "bg-pink-50/40 text-gray-700 border-pink-100",
          tag: "bg-pink-100 text-pink-700",
          titleColor: "text-gray-900",
        };
    }
  };

  const currentThemeStyle = getThemeStyles(theme);

  return (
    <div className="p-4 sm:p-8 w-full max-w-6xl mx-auto min-h-screen bg-gray-50 pb-20 box-border">
      {/* 상단 프로필 및 로그아웃 바 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 w-full box-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">작성자 대시보드</h1>
          
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {!isEditingNickname ? (
              <>
                <p className="text-sm text-gray-500">
                  환영합니다, <span className="font-semibold text-blue-600">{nickname}</span>님!
                </p>
                <button 
                  onClick={() => setIsEditingNickname(true)} 
                  className="text-xs text-gray-400 hover:text-blue-600 underline"
                >
                  닉네임 변경
                </button>
              </>
            ) : (
              <form onSubmit={handleUpdateNickname} className="flex items-center gap-2 mt-1" autoComplete="off">
                <input
                  type="text"
                  value={newNickname}
                  onChange={(e) => setNewNickname(e.target.value)}
                  className="border px-2 py-1 rounded text-sm text-black w-32"
                  autoComplete="off"
                />
                <button type="submit" className="bg-blue-600 text-white text-xs px-2 py-1 rounded">저장</button>
                <button type="button" onClick={() => setIsEditingNickname(false)} className="text-xs text-gray-500">취소</button>
              </form>
            )}
          </div>
        </div>

        <button onClick={handleLogout} className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-100 transition self-end sm:self-auto">
          로그아웃
        </button>
      </div>

      {/* 반응형 2단 그리드 (모바일에서는 1단 세로 배치, lg 이상에서 좌우 2단 배치) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12 justify-center items-start w-full">
        
        {/* 좌측: 새 편지 작성 폼 */}
        <form onSubmit={handleCreateLetter} className="flex flex-col gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 w-full box-border" autoComplete="off">
          <h2 className="text-lg font-bold text-gray-800">💌 새로운 편지 작성하기</h2>
          
          {/* 테마 및 스탬프 선택 UI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">편지지 테마</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full border border-gray-200 p-2 rounded-lg text-xs bg-white text-black focus:outline-none focus:border-blue-500"
              >
                <option value="pink">🌸 스위트 핑크</option>
                <option value="lavender">💜 라벤더 드림</option>
                <option value="beige">☕ 코지 베이지</option>
                <option value="dark">🌙 미드나잇 다크</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">우표 아이콘</label>
              <select
                value={stampType}
                onChange={(e) => setStampType(e.target.value)}
                className="w-full border border-gray-200 p-2 rounded-lg text-xs bg-white text-black focus:outline-none focus:border-blue-500"
              >
                <option value="💌">💌 하트 편지</option>
                <option value="✈️">✈️ 에어 메일</option>
                <option value="🍀">🍀 클로버</option>
                <option value="⭐">⭐ 별빛</option>
                <option value="🐱">🐱 귀여운 냥이</option>
              </select>
            </div>
          </div>

          <input
            type="text"
            name="new_letter_title"
            autoComplete="off"
            placeholder="편지 제목 (예: 생일 축하해!)"
            className="border border-gray-200 p-3 rounded-xl text-black bg-gray-50 focus:bg-white focus:outline-none focus:border-blue-500 transition text-sm w-full box-border"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            name="new_letter_content"
            autoComplete="off"
            placeholder="상대방에게 전하고 싶은 마음을 적어보세요..."
            className="border border-gray-200 p-3 rounded-xl h-36 text-black bg-gray-50 focus:bg-white focus:outline-none focus:border-blue-500 transition text-sm resize-none w-full box-border"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <input
            type="password"
            name="new_letter_passcode"
            autoComplete="new-password"
            placeholder="수신자 확인용 비밀번호"
            className="border border-gray-200 p-3 rounded-xl text-black bg-gray-50 focus:bg-white focus:outline-none focus:border-blue-500 transition text-sm w-full box-border"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
          />

          <input
            type="text"
            name="new_letter_hint"
            autoComplete="off"
            placeholder="비밀번호 힌트 (선택 입력, 예: 우리 처음 만난 날)"
            className="border border-gray-200 p-3 rounded-xl text-black bg-gray-50 focus:bg-white focus:outline-none focus:border-blue-500 transition text-sm w-full box-border"
            value={passcodeHint}
            onChange={(e) => setPasscodeHint(e.target.value)}
          />

          <button type="submit" className="bg-blue-600 text-white p-3 rounded-xl font-semibold hover:bg-blue-700 transition shadow-sm w-full box-border">
            편지 링크 생성하기 ✨
          </button>
        </form>

        {/* 우측: 수신자 화면 실시간 미리보기 */}
        <div className={`p-6 rounded-2xl border flex flex-col justify-between sticky top-8 w-full box-border transition-colors duration-300 ${currentThemeStyle.container}`}>
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${currentThemeStyle.tag}`}>
                🔍 수신자 화면 미리보기
              </span>
              <span className="text-xs opacity-60">실시간 반영 중</span>
            </div>

            <div className={`rounded-2xl shadow-md p-6 border w-full box-border transition-colors duration-300 relative ${currentThemeStyle.card}`}>
              <div className="absolute top-6 right-6 text-2xl bg-white/80 backdrop-blur-sm p-2 rounded-xl shadow-sm border border-gray-100">
                {stampType}
              </div>

              {nickname && (
                <div className="mb-2 pr-10">
                  <span className={`text-xs px-3 py-1 rounded-full font-semibold ${currentThemeStyle.tag}`}>
                    From. {nickname}
                  </span>
                </div>
              )}
              <h3 className={`text-xl font-bold mb-3 border-b pb-2 break-all pr-8 ${currentThemeStyle.titleColor}`}>
                {title || "편지 제목이 여기에 표시됩니다."}
              </h3>
              <div className={`p-4 rounded-xl h-36 overflow-y-auto whitespace-pre-wrap break-all text-sm leading-relaxed border ${currentThemeStyle.previewBox}`}>
                {content || "상대방에게 전하고 싶은 마음을 적어보세요. 작성하는 내용이 실시간으로 여기에 나타납니다!"}
              </div>
              {passcodeHint && (
                <div className="mt-3 text-xs font-medium break-all opacity-80">
                  💡 비밀번호 힌트: {passcodeHint}
                </div>
              )}
            </div>
          </div>

          <p className="text-[11px] opacity-60 text-center mt-6">
            * 상대방이 링크를 통해 접속했을 때 보게 되는 화면입니다.
          </p>
        </div>

      </div>

      {createdLink && (
        <div className="mb-12 p-6 bg-green-50 border border-green-200 rounded-2xl shadow-sm max-w-2xl mx-auto w-full box-border">
          <p className="text-sm font-bold text-green-800 mb-2">🎉 편지 링크가 생성되었습니다!</p>
          <input
            type="text"
            readOnly
            value={createdLink}
            className="w-full p-3 border border-green-300 rounded-xl bg-white text-black text-sm mb-3 focus:outline-none box-border"
          />
          <button
            onClick={() => {
              navigator.clipboard.writeText(createdLink);
              alert("링크가 클립보드에 복사되었습니다!");
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-700 transition w-full"
          >
            링크 복사하기 📋
          </button>
        </div>
      )}

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 w-full box-border">
        <h2 className="text-lg font-bold text-gray-800 mb-6">📬 내가 보낸 편지 & 받은 답장함</h2>

        {loadingLetters ? (
          <p className="text-sm text-gray-400 text-center py-6">목록을 불러오는 중...</p>
        ) : letters.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">아직 작성한 편지가 없습니다.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            {letters.map((letter) => (
              <div key={letter.id} className="border border-gray-100 bg-gray-50/50 p-5 rounded-xl flex flex-col justify-between box-border">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{letter.stamp_type || "💌"}</span>
                      <h3 className="font-bold text-gray-900 text-base">{letter.title}</h3>
                    </div>
                    <span className="text-xs text-gray-400">{new Date(letter.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-4 line-clamp-2">{letter.content}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-200">
                  <h4 className="text-xs font-bold text-gray-700 mb-2">💬 도착한 답장 ({letter.replies?.length || 0})</h4>
                  {letter.replies && letter.replies.length > 0 ? (
                    <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
                      {letter.replies.map((reply) => (
                        <div key={reply.id} className="bg-white p-3 rounded-lg border border-gray-200 text-sm">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-xs text-blue-600">From. {reply.sender_name || "익명"}</span>
                            <span className="text-[10px] text-gray-400">{new Date(reply.created_at).toLocaleString()}</span>
                          </div>
                          <p className="text-gray-800">{reply.message}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">아직 도착한 답장이 없습니다.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}