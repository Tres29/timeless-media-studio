
interface SectionHeadingProps {
  title: string;
  children?: React.ReactNode;
}

const SectionHeading = ({ title, children }: SectionHeadingProps) => {
    return (
        <h2 
            className="flex justify-center items-center"
        >
            <span 
                className="poppins px-8 py-4 w-[420px] text-lg lg:text-6xl font-bold rounded text-black text-center font-bold text-shadow-lg"
            >
                { children || title}
            </span>
        </h2>
    );
}

export default SectionHeading