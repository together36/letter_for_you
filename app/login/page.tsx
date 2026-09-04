"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [isSignUp, setIsSignUp] = useState(false);

  // 로그인 / 회원가입 처리
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { nickname: email.split("@")[0] },
        },
      });

      if (error) {
        alert("회원가입 실패: " + error.message);
        setLoading(false);
      } else if (!data.session) {
        alert("회원가입 요청 성공! 이메일 인증이 설정된 경우 이메일함을 확인해 주세요. (인증 미설정 시 바로 로그인 가능)");
        setIsSignUp(false);
        setLoading(false);
      } else {
        alert("🎉 회원가입 성공! 대시보드로 이동합니다.");
        router.push("/dashboard");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        alert("로그인 실패: " + error.message);
        setLoading(false);
      } else {
        router.push("/dashboard");
      }
    }
  };

  // 🚀 외부 공유 접속자용 1초 데모 로그인 (고유 방문자 계정 생성)
  const handleDemoLogin = async () => {
    setLoading(true);

    try {
      // 1. 매번 새로운 방문자용 데모 계정 생성 (기존 계정 충돌 방지)
      const guestId = Math.floor(100000 + Math.random() * 900000);
      const demoEmail = `guest_${guestId}@letterforyou.com`;
      const demoPassword = "demopassword123!";

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: demoEmail,
        password: demoPassword,
        options: {
          data: { nickname: `방문자_${guestId}` },
        },
      });

      if (signUpError) {
        alert("데모 로그인 실패: " + signUpError.message);
        setLoading(false);
        return;
      }

      // 2. 세션이 즉시 생성되었는지 확인
      if (!signUpData.session) {
        alert(
          "⚠️ 데모 로그인 세션 생성 불가!\n\n원인: Supabase 'Confirm Email(이메일 인증)'이 켜져 있어 타인 접속 시 자동 로그인이 차단됩니다.\n\n해결 방법:\nSupabase 대시보드 > Authentication > Providers > Email 메뉴에서 'Confirm email'을 OFF로 꺼주시면 타인도 1초 만에 바로 들어옵니다!"
        );
        setLoading(false);
        return;
      }

      alert(`✨ 데모 모드로 로그인되었습니다! (닉네임: 방문자_${guestId})`);
      router.push("/dashboard");
    } catch (err: any) {
      alert("데모 로그인 중 오류 발생: " + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-pink-50 p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-pink-100">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">💌</div>
          <h1 className="text-2xl font-bold text-gray-900">Letter To You</h1>
          <p className="text-sm text-gray-500 mt-1">소중한 마음을 비밀 편지로 전해보세요</p>
        </div>

        {/* 일반 로그인 / 회원가입 폼 */}
        <form onSubmit={handleAuth} className="flex flex-col gap-4 mb-4">
          <input
            type="email"
            placeholder="이메일 주소"
            className="border border-gray-200 p-3 rounded-xl text-black text-sm focus:outline-none focus:border-pink-500 bg-gray-50"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="비밀번호"
            className="border border-gray-200 p-3 rounded-xl text-black text-sm focus:outline-none focus:border-pink-500 bg-gray-50"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-pink-500 text-white p-3 rounded-xl font-semibold hover:bg-pink-600 transition shadow-sm text-sm"
          >
            {loading ? "처리 중..." : isSignUp ? "회원가입하기" : "로그인하기"}
          </button>
        </form>

        <div className="text-center mb-6">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs text-pink-600 hover:underline font-medium"
          >
            {isSignUp ? "이미 계정이 있으신가요? 로그인하기" : "계정이 없으신가요? 회원가입하기"}
          </button>
        </div>

        <div className="relative flex py-2 items-center mb-6">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="flex-shrink mx-4 text-xs text-gray-400">또는</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        {/* 🎓 졸업작품/시연용 데모 모드 버튼 */}
        <button
          onClick={handleDemoLogin}
          disabled={loading}
          type="button"
          className="w-full bg-gray-900 text-white p-3 rounded-xl font-semibold hover:bg-black transition shadow-sm text-sm flex items-center justify-center gap-2"
        >
          <span>🚀 1초 만에 체험하기 (데모 모드)</span>
        </button>
        <p className="text-[11px] text-gray-400 text-center mt-3">
          * 방문자용 버튼입니다. 가입 없이 즉시 체험해보세요!
        </p>
      </div>
    </div>
  );
}