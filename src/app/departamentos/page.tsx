import { PublicSectionPage } from "@/components/public-section-page";

export default function DepartmentsPage() {
  return <PublicSectionPage eyebrow="Serviço" title="Departamentos e áreas de serviço" introduction="Esta secção apresentará os departamentos e as áreas de serviço oficialmente divulgados pela organização." items={[
    { title: "Departamentos", description: "Apresentação dos departamentos activos e das respectivas informações institucionais." },
    { title: "Equipas e responsabilidades", description: "Informações públicas sobre equipas e responsabilidades, conforme autorização institucional." },
  ]} />;
}
