"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
	Terminal,
	Shield,
	ArrowRight,
	UserCheck,
	Lock,
	Code2,
} from "lucide-react";

export default function LandingPage() {
	const router = useRouter();
	const [studentId, setStudentId] = useState("");
	const [groupCode, setGroupCode] = useState("");
	const [error, setError] = useState("");

	const handleStudentJoin = (e: React.FormEvent) => {
		e.preventDefault();
		if (!studentId.trim() || !groupCode.trim()) {
			setError("Please enter both your Student ID and Session Code.");
			return;
		}
		setError("");
		// Route to the student exam workspace
		router.push(
			`/exam?studentId=${encodeURIComponent(studentId)}&code=${encodeURIComponent(groupCode)}`,
		);
	};

	return (
		<div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans">
			{/* Header / Navbar */}
			<header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur px-6 py-4 flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div className="bg-indigo-600 p-2 rounded-lg">
						<Terminal className="w-6 h-6 text-white" />
					</div>
					<span className="text-xl font-bold tracking-tight text-white">
						CodeGavel
					</span>
				</div>
				<div className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors py-2 px-4 rounded-lg hover:bg-slate-800">
					<Lock className="w-4 h-4" />
					Teacher Portal
				</div>
			</header>

			{/* Main Hero & Student Portal */}
			<main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12 flex flex-col lg:flex-row items-center justify-between gap-12">
				{/* Left Column: Platform Branding */}
				<div className="flex-1 space-y-6 text-center lg:text-left">
					<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950 border border-indigo-800 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
						<Shield className="w-3.5 h-3.5" /> Local LAN Examination System
					</div>
					<h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
						Secure, Offline C Programming Assessment
					</h1>
					<p className="text-lg text-slate-400 max-w-xl">
						A lightweight, local-first laboratory platform providing automated C
						code execution, randomized problem assignment, and real-time strike
						detection.
					</p>

					{/* Quick Feature Pillars */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-left">
						<div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
							<Code2 className="w-5 h-5 text-indigo-400 mb-2" />
							<h3 className="text-sm font-semibold text-slate-200">
								GCC Compiler
							</h3>
							<p className="text-xs text-slate-400 mt-1">
								Native C compilation sandbox with automated assertions.
							</p>
						</div>
						<div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
							<Shield className="w-5 h-5 text-amber-400 mb-2" />
							<h3 className="text-sm font-semibold text-slate-200">
								Anti-Cheat
							</h3>
							<p className="text-xs text-slate-400 mt-1">
								Coalesced strike signals and live automated lockouts.
							</p>
						</div>
						<div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
							<UserCheck className="w-5 h-5 text-emerald-400 mb-2" />
							<h3 className="text-sm font-semibold text-slate-200">
								Roster Sync
							</h3>
							<p className="text-xs text-slate-400 mt-1">
								Excel ingestion & Fisher-Yates problem shuffling.
							</p>
						</div>
					</div>
				</div>

				{/* Right Column: Student Exam Entry Form */}
				<div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
					<div className="mb-6 text-center">
						<h2 className="text-2xl font-bold text-white">Join Exam Session</h2>
						<p className="text-sm text-slate-400 mt-1">
							Enter your assigned credentials to launch your terminal
						</p>
					</div>

					<form onSubmit={handleStudentJoin} className="space-y-4">
						{error && (
							<div className="p-3 bg-red-950/60 border border-red-800 rounded-lg text-red-400 text-xs text-center font-medium">
								{error}
							</div>
						)}

						<div>
							<label
								htmlFor="studentId"
								className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2"
							>
								Student ID Number
							</label>
							<input
								id="studentId"
								type="text"
								placeholder="e.g. 2026-10492"
								value={studentId}
								onChange={(e) => setStudentId(e.target.value)}
								className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
							/>
						</div>

						<div>
							<label
								htmlFor="groupCode"
								className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2"
							>
								Session / Room Code
							</label>
							<input
								id="groupCode"
								type="text"
								placeholder="e.g. CS101-LAB-A"
								value={groupCode}
								onChange={(e) => setGroupCode(e.target.value.toUpperCase())}
								className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm tracking-wider uppercase transition-all"
							/>
						</div>

						<button
							type="submit"
							className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors mt-2 shadow-lg shadow-indigo-600/20"
						>
							Start Examination
							<ArrowRight className="w-4 h-4" />
						</button>
					</form>

					<div className="mt-6 pt-6 border-t border-slate-800 text-center">
						<p className="text-xs text-slate-500">
							LAN Address Mode • Ensure you are connected to the lab router.
						</p>
					</div>
				</div>
			</main>

			{/* Footer */}
			<footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
				CodeGavel Examination Platform • Local LAN Deployment
			</footer>
		</div>
	);
}
