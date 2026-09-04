"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "../../../lib/supabase";

interface LetterData {
  id: string;
  title: string;
  content: string;
  passcode: string;
  passcode_hint?: string;
  sender_name?: string;
  created_at: string;
}

export default function LetterPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const letterId = resolvedParams.id;

  const [letter, setLetter] = useState<LetterData | null>(null);
  const [passcode, setPasscode] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showHint, setShowHint] = useState(false);

  const [replyName, setReplyName] = useState("");
  const [message, setMessage] = useState("");
  const [replySubmitted, setReplySubmitted] = useState(false);

  useEffect(() => {
    const fetchLetter = async () => {
      const { data, error } = await supabase
        .from("letters")
        .select("*")
        .eq("id", letterId)
        .single();

      if (error) {
        console.error(error);
      } else {
        setLetter(data);
      }
      setLoading(false);
    };

    fetchLetter();
  }, [letterId]);

  if (loading) return <div className="p-10 text-center">편지를 불러오는 중...</div>;
  if (!letter) return <div className="p-10 text-center text-red-500">존재하지 않거나 삭제된 편지입니다.</div>;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === letter.passcode) {
      setIsUnlocked(true);
    } else {
      alert("비밀번호가 틀렸습니다!");
      setShowHint(true);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyName.trim()) {
      alert("보내는 분의 닉네임을 입력해주세요!");
      return;
    }
    if (!message.trim()) {
      alert("답장 내용을 입력해주세요!");
      return;
    }

    const { error } = await supabase
      .from("replies")
      .insert([
        {
          letter_id: letterId,
          sender_name: replyName,
          message: message,
          stamp_type: "default",
        },
      ]);

    if (error) {
      alert("답장 전송 실패: " + error.message);
    } else {
      setReplySubmitted(true);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-pink-50 p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-pink-100">
        {!isUnlocked ? (
          <form onSubmit={handleUnlock} className="flex flex-col items-center">
            <div className="text-4xl mb-4">💌</div>
            {letter.sender_name && (
              <span className="text-xs bg-pink-100 text-pink-700 px-3 py-1 rounded-full font-semibold mb-2">
                {letter.sender_name}님이 보낸 편지
              </span>
            )}
            <h1 className="text-xl font-bold text-gray-800 mb-2">{letter.title}</h1>
            <p className="text-sm text-gray-500 mb-6 text-center">작성자가 설정한 비밀번호를 입력해야 편지를 열어볼 수 있어요.</p>
            
            <input
              type="password"
              placeholder="비밀번호 입력"
              className="w-full border border-gray-300 p-3 rounded-xl mb-3 text-black text-center focus:outline-none focus:border-pink-500"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
            />

            {showHint && letter.passcode_hint && (
              <div className="w-full mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-xs text-yellow-800 text-center">
                💡 힌트: {letter.passcode_hint}
              </div>
            )}

            <button type="submit" className="w-full bg-pink-500 text-white p-3 rounded-xl font-semibold hover:bg-pink-600 transition">
              편지 열어보기 ✨
            </button>
          </form>
        ) : (
          <div>
            {letter.sender_name && (
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-xs bg-pink-100 text-pink-700 px-3 py-1 rounded-full font-semibold">
                  From. {letter.sender_name}
                </span>
              </div>
            )}
            <h1 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">{letter.title}</h1>
            <div className="bg-pink-50/50 p-4 rounded-xl mb-6 min-h-[120px] whitespace-pre-wrap text-gray-700 leading-relaxed">
              {letter.content}
            </div>
            <p className="text-xs text-right text-gray-400 mb-6">
              작성일: {new Date(letter.created_at).toLocaleDateString()}
            </p>

            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-800 mb-3 text-sm">✍️ 작성자에게 답장 남기기</h3>
              {!replySubmitted ? (
                <form onSubmit={handleSendReply} className="flex flex-col gap-2">
                  <input
                    type="text"
                    placeholder="답장 시 표시 될 이름"
                    className="w-full border p-3 rounded-xl text-black text-sm focus:outline-none focus:border-pink-500"
                    value={replyName}
                    onChange={(e) => setReplyName(e.target.value)}
                  />
                  <textarea
                    placeholder="따뜻한 마음을 담아 답장을 적어보세요..."
                    className="w-full border p-3 rounded-xl text-black text-sm h-24 focus:outline-none focus:border-pink-500"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  <button type="submit" className="bg-gray-900 text-white py-2 rounded-xl text-sm font-semibold hover:bg-black transition">
                    답장 보내기 ✈️
                  </button>
                </form>
              ) : (
                <div className="bg-green-50 border border-green-200 p-4 rounded-xl text-center text-green-800 text-sm">
                  답장이 성공적으로 전달되었습니다! 💌
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}