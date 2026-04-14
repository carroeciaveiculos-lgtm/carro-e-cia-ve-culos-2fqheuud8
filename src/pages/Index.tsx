import { Hero } from '@/components/home/Hero'
import { Consignment } from '@/components/home/Consignment'
import { StockAndFeatures } from '@/components/home/StockAndFeatures'
import { TestimonialsAndLocation } from '@/components/home/TestimonialsAndLocation'

export default function Index() {
  return (
    <div className="flex flex-col min-h-screen">
      <Hero />
      <Consignment />
      <StockAndFeatures />
      <TestimonialsAndLocation />
    </div>
  )
}
