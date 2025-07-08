import InterviewForm from "@/components/InterviewForm";
import { getCurrentUser } from "@/lib/actions/auth.action";

const Page = async () => {
  const user = await getCurrentUser();

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Create New Interview</h1>
          <p className="text-gray-600 mt-2">
            Fill out the details below to generate your personalized interview
            questions
          </p>
        </div>

        <InterviewForm userId={user?.id!} />
      </div>
    </>
  );
};

export default Page;
