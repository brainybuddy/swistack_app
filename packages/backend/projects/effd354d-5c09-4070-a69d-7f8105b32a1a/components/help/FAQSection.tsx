'use client';
import { Disclosure } from '@headlessui/react'
import { ChevronDown } from 'lucide-react'
const faqs = [
  {
    question: "How do I reset my password?",
    answer: "You can reset your password by clicking the 'Forgot Password' link on the login page. Follow the instructions sent to your email."
  },
  {
    question: "How do I enroll in a course?",
    answer: "Browse our course catalog, select your desired course, and click the 'Enroll Now' button. Follow the payment process to complete enrollment."
  },
  {
    question: "Can I get a refund?",
    answer: "Yes, we offer a 30-day money-back guarantee for all courses. Contact support with your order details to process the refund."
  },
  {
    question: "How do I download course materials?",
    answer: "Once enrolled, you can find downloadable materials in the 'Resources' section of each course lesson."
  }
]
export default function FAQSection() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <Disclosure key={index}>
            {({ open }) => (
              <div className="border-b border-gray-200 pb-4">
                <Disclosure.Button className="flex w-full justify-between items-center text-left">
                  <span className="text-gray-900 font-medium">{faq.question}</span>
                  <ChevronDown className={`${open ? 'transform rotate-180' : ''} w-5 h-5 text-gray-500`} />
                </Disclosure.Button>
                <Disclosure.Panel className="mt-4 text-gray-600">
                  {faq.answer}
                </Disclosure.Panel>
              </div>
            )}
          </Disclosure>
        ))}
      </div>
    </div>
  )
}