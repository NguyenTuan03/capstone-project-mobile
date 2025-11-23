
// const handleAnalyzeTechnique = useCallback(async () => {
//     if (!coachLocalPath || !learnerLocalPath) {
//       Alert.alert("Lỗi", "Video chưa sẵn sàng. Vui lòng thử lại.");
//       return;
//     }

//     setIsAnalyzing(true);
//     setError(null);
//     setAnalysisResult(null);

//     try {
//       // Get duration from multiple sources, prioritize video player duration
//       let coachDuration = 0;
//       let learnerDuration = 0;
      
//       // Try to get duration from video player (most accurate)
//       if (coachPlayer?.duration) {
//         coachDuration = coachPlayer.duration;
//       } else if (submission?.session?.videos?.[0]?.duration) {
//         // Duration from API (might be in minutes, convert to seconds)
//         const apiDuration = submission.session.videos[0].duration;
//         coachDuration = typeof apiDuration === 'number' ? apiDuration : parseFloat(apiDuration) || 0;
//         // If duration seems too large (> 100), assume it's in seconds, otherwise might be minutes
//         if (coachDuration < 100 && coachDuration > 0) {
//           coachDuration = coachDuration * 60; // Convert minutes to seconds
//         }
//       } else if (submission?.session?.lesson?.videos?.[0]?.duration) {
//         const apiDuration = submission.session.lesson.videos[0].duration;
//         coachDuration = typeof apiDuration === 'number' ? apiDuration : parseFloat(apiDuration) || 0;
//         if (coachDuration < 100 && coachDuration > 0) {
//           coachDuration = coachDuration * 60;
//         }
//       }
      
//       // Get learner video duration
//       if (learnerPlayer?.duration) {
//         learnerDuration = learnerPlayer.duration;
//       } else if (submission?.duration != null) {
//         // submission.duration is usually in seconds
//         if (typeof submission.duration === 'number') {
//           learnerDuration = submission.duration;
//         } else {
//           learnerDuration = parseFloat(String(submission.duration)) || 0;
//         }
//       }
//       // Calculate valid timestamps
//       const coachTimestamps = calculateTimestamps(coachDuration);
//       const learnerTimestamps = calculateTimestamps(learnerDuration);
      
//       // Validate timestamps before sending
//       if (coachTimestamps.length === 0 || learnerTimestamps.length === 0) {
//         throw new Error("Không thể tính toán timestamps hợp lệ từ video. Vui lòng kiểm tra độ dài video.");
//       }
      
//       // Check if any timestamp exceeds duration
//       const invalidCoachTimestamps = coachTimestamps.filter(t => t >= coachDuration);
//       const invalidLearnerTimestamps = learnerTimestamps.filter(t => t >= learnerDuration);
      
//       if (invalidCoachTimestamps.length > 0 || invalidLearnerTimestamps.length > 0) {
//         // Filter out invalid timestamps
//         const validCoachTimestamps = coachTimestamps.filter(t => t < coachDuration);
//         const validLearnerTimestamps = learnerTimestamps.filter(t => t < learnerDuration);
        
//         if (validCoachTimestamps.length === 0 || validLearnerTimestamps.length === 0) {
//           throw new Error("Không có timestamps hợp lệ sau khi validate. Video có thể quá ngắn.");
//         }
        
//         // Use filtered timestamps
//         const fullResult = await geminiService.compareVideosWithBackend(
//           coachLocalPath,
//           learnerLocalPath,
//           validCoachTimestamps,
//           validLearnerTimestamps
//         );
//         setAnalysisResult(fullResult);
//       } else {
//         // All timestamps are valid, proceed normally
//         const fullResult = await geminiService.compareVideosWithBackend(
//           coachLocalPath,
//           learnerLocalPath,
//           coachTimestamps,
//           learnerTimestamps
//         );
//         setAnalysisResult(fullResult);
//       }
  
//     } catch (err) {
//       console.error("Analysis failed:", err);
//       if (err instanceof Error) {
//         setError(err.message);
//       } else {
//         setError("Đã xảy ra lỗi không xác định.");
//       }
//     } finally {
//       setIsAnalyzing(false);
//     }
//   }, [coachLocalPath, learnerLocalPath, submission, coachPlayer, learnerPlayer]);
    