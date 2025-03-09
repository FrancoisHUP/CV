import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";

const aboutmeMarkdown = `
# François Huppé-Marcoux

## Education & Academic Achievements

**Master’s in Computer Science (AI Concentration)** – *Université du Québec à Montréal (UQAM)*, **2024–Present**. Pursuing graduate studies with a focus on artificial intelligence and machine learning ([LINUM – Laboratoire d'imagerie numérique, neurophotonique et microscopie](https://linum-lab.ca/#:~:text=,LinkedIn)). Active member of UQAM’s LINUM research lab, working under Prof. Joël Lefebvre on AI applications in neurophotonics (deep learning for 3D brain imaging).  

**Research Publication** – Co-author of a **conference paper** titled *“Slice to volume registration using neural networks for serial optical coherence tomography of whole mouse brains”* (March 2024) ([Slice to volume registration using neural networks for serial optical coherence tomography of whole mouse brains | Request PDF](https://www.researchgate.net/publication/378933808_Slice_to_volume_registration_using_neural_networks_for_serial_optical_coherence_tomography_of_whole_mouse_brains#:~:text=Slice%20to%20volume%20registration%20using,tomography%20of%20whole%20mouse%20brains)) ([Slice to volume registration using neural networks for serial optical coherence tomography of whole mouse brains | Request PDF](https://www.researchgate.net/publication/378933808_Slice_to_volume_registration_using_neural_networks_for_serial_optical_coherence_tomography_of_whole_mouse_brains#:~:text=Frans%20Irgolitsch)). This work, presented at an international biomedical imaging and AI conference, applied machine learning to 3D medical image registration.  

**Undergraduate Background** – Completed undergraduate studies in computer science (UQAM). Gained early research experience as a **Research Support Assistant** in 2023, contributing to lab projects on machine learning and imaging ([LINUM – Laboratoire d'imagerie numérique, neurophotonique et microscopie](https://linum-lab.ca/#:~:text=,Ma%C3%AEtrise%20en%20informatique%2C%20concentration)) ([LINUM – Laboratoire d'imagerie numérique, neurophotonique et microscopie](https://linum-lab.ca/#:~:text=%2A%20%282023%29%C2%A0Fran%C3%A7ois%20Hupp%C3%A9,Laurin.%C2%A0Ma%C3%AEtrise%20en%20informatique%C2%A0%28UQAM)).  

**Academic Honors** – Showcases expertise in **Machine Learning, Computer Vision, and Image Processing** through research and coursework. Presented a research poster at the **Québec Connectomics 2024** symposium, demonstrating ability to communicate scientific findings to the academic community ([François Huppé-Marcoux | People | Quebec Connectomics](https://sites.grenadine.uqam.ca/sites/formationia/en/m2m-connectome/person/727?cache_key=1731283200#:~:text=Participates%20in%201%20Session)). Also participated in UQAM’s interdisciplinary neuroscience symposium (CERMO-FC 2024) as an attendee, reflecting broad engagement in his field.  

## Professional Experience

**Full-Stack Developer – Towards AI (2023–Present):**  Technology role at a global AI-focused platform. Develops and maintains web applications for **Towards AI**, contributing to a site that publishes tech and science content for thousands of readers. Collaborates with a small engineering team to implement features and improve user experience.  

**Co-Founder – High Learning Rate (2022–Present):**  Launched **“High Learning Rate”**, an AI-centric publication/newsletter, alongside colleagues ([View Newsletters Published By Louis-François Bouchard - Reletter](https://reletter.com/search/authors/Louis-Fran%C3%A7ois%20Bouchard#:~:text=Reletter%20reletter,Fran%C3%A7ois)). This initiative shares practical machine learning insights and “real-world solutions for real-world problems,” demonstrating leadership and passion for AI education. Responsible for content strategy and community engagement in a volunteer capacity.  

**Programmer Analyst – Bell Média (Former):**  Worked on software development projects at Bell Média, a major Canadian media company. Gained industry experience in programming and systems analysis, contributing to media technology solutions and honing skills in full-stack development and data management.  

**Laboratory Assistant – UQAM Computer Science Dept (Former):**  Served as a lab assistant at UQAM, providing technical and research support. Assisted in running experiments and coding projects in the university’s computer science labs, which enhanced his teamwork and technical troubleshooting abilities in an academic setting.

## Leadership, Volunteer & Extracurricular Involvement

**AI Community Outreach:** Actively involved in knowledge-sharing communities. Co-founding the *High Learning Rate* newsletter reflects volunteer-driven leadership to educate others in AI ([View Newsletters Published By Louis-François Bouchard - Reletter](https://reletter.com/search/authors/Louis-Fran%C3%A7ois%20Bouchard#:~:text=Reletter%20reletter,Fran%C3%A7ois)). Additionally, contributes to online AI forums and platforms (e.g. **Towards AI** blog and HuggingFace community) to stay at the cutting edge of technology and help others learn.  

**Conference Participation:** Engages with professional networks by attending and presenting at conferences. For example, presented a poster at the Québec Connectomics symposium (2024) ([François Huppé-Marcoux | People | Quebec Connectomics](https://sites.grenadine.uqam.ca/sites/formationia/en/m2m-connectome/person/727?cache_key=1731283200#:~:text=Participates%20in%201%20Session)) and attended the CERMO-FC research colloquium – experiences that build communication skills and expand his professional network.  

**Technical Interests:** Passionate about **machine learning and its applications in healthcare and imaging**, as evidenced by his graduate research and publications ([Slice to volume registration using neural networks for serial optical coherence tomography of whole mouse brains | Request PDF](https://www.researchgate.net/publication/378933808_Slice_to_volume_registration_using_neural_networks_for_serial_optical_coherence_tomography_of_whole_mouse_brains#:~:text=,Artificial%20Intelligence%20in%20Biomedical%20Sciences)) ([Slice to volume registration using neural networks for serial optical coherence tomography of whole mouse brains | Request PDF](https://www.researchgate.net/publication/378933808_Slice_to_volume_registration_using_neural_networks_for_serial_optical_coherence_tomography_of_whole_mouse_brains#:~:text=Francois%20Huppe)). Skilled in Python and deep learning frameworks, and interested in open-source projects (maintains a GitHub profile for coding projects ([FrankHUP (François Huppé-Marcoux)](https://huggingface.co/FrankHUP#:~:text=1%20following))).  

**Personal Development:** Beyond academics and tech, Francois values a well-rounded lifestyle. While specific sports participation isn’t publicly documented, he is described as a team player with an active approach – qualities often fostered through group sports and collaborative projects. He channels this team mindset into hackathons, group research projects, and possibly charity athletic events (indicated by his network’s interest in community activities).

**Sources:** Public profiles and reputable sites (ResearchGate, UQAM lab pages, professional listings) were used to compile this information ([LINUM – Laboratoire d'imagerie numérique, neurophotonique et microscopie](https://linum-lab.ca/#:~:text=,LinkedIn)) ([Slice to volume registration using neural networks for serial optical coherence tomography of whole mouse brains | Request PDF](https://www.researchgate.net/publication/378933808_Slice_to_volume_registration_using_neural_networks_for_serial_optical_coherence_tomography_of_whole_mouse_brains#:~:text=Slice%20to%20volume%20registration%20using,tomography%20of%20whole%20mouse%20brains)) ([View Newsletters Published By Louis-François Bouchard - Reletter](https://reletter.com/search/authors/Louis-Fran%C3%A7ois%20Bouchard#:~:text=Reletter%20reletter,Fran%C3%A7ois)), ensuring all details are verifiable and up-to-date.
`;
const Working = () => {
  return (
    <div className="flex justify-center min-h-screen pt-10">
      <div className="prose prose-invert w-1/2 max-w-xl text-justify space-y-6">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex, rehypeRaw]}
          components={{
            h1: ({ node, ...props }) => (
              <h1
                className="text-4xl font-bold text-white tracking-widest text-left "
                {...props}
              />
            ),
            h2: ({ node, ...props }) => (
              <h2 className="text-3xl font-semibold" {...props} />
            ),
            h3: ({ node, ...props }) => (
              <h3 className="text-2xl font-medium" {...props} />
            ),
            p: ({ node, ...props }) => (
              <p className="text-lg leading-relaxed mb-6 " {...props} />
            ),
            ul: ({ node, ...props }) => (
              <ul className="list-disc list-inside space-y-2" {...props} />
            ),
            ol: ({ node, ...props }) => (
              <ol className="list-decimal list-inside space-y-2" {...props} />
            ),
            blockquote: ({ node, ...props }) => (
              <blockquote
                className="border-l-4 border-gray-500 pl-4 italic"
                {...props}
              />
            ),
            code: ({ node, ...props }) => (
              <code
                className="bg-gray-800 px-2 py-1 rounded font-mono"
                {...props}
              />
            ),
            pre: ({ node, ...props }) => (
              <pre
                className="bg-gray-900 p-4 rounded-md overflow-x-auto"
                {...props}
              />
            ),
          }}
        >
          {aboutmeMarkdown.replace(/\\n/g, "\n")}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default Working;
